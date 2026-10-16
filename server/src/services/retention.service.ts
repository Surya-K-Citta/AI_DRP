import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { ClusterSection } from '../models/ClusterSection.model';
import { KycFile } from '../models/KycFile.model';
import { User } from '../models/User.model';
import { AuditService } from './audit.service';
import { NotifyService } from './notify.service';
import { retentionIdleDays, retentionWarningDays, auditRetentionDays } from '../lib/kycStorage';
import { purgeAuditEvents } from '../lib/auditChain';
import { CloudinaryService } from './cloudinary.service';
import fs from 'fs';
import path from 'path';

export type RetentionResult = {
  warned: number;
  purged: number;
  auditPurged: number;
  idleDays: number;
  warningDays: number;
  auditDays: number;
  details: Array<{ dprId: string; action: 'warn' | 'purge'; userId?: string }>;
};

function collectPublicIds(value: unknown, out: Set<string>, depth = 0): void {
  if (value == null || depth > 10) return;
  if (typeof value === 'string' && /res\.cloudinary\.com/i.test(value)) {
    const match = value.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match?.[1]) out.add(match[1]);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPublicIds(item, out, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.cloudinaryPublicId === 'string') out.add(obj.cloudinaryPublicId);
    Object.values(obj).forEach((item) => collectPublicIds(item, out, depth + 1));
  }
}

function collectKycFileIds(value: unknown, out: Set<string>, depth = 0): void {
  if (value == null || depth > 12) return;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('file:') && trimmed.length > 5) out.add(trimmed.slice(5));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectKycFileIds(item, out, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.fileId === 'string' && obj.fileId.trim()) out.add(obj.fileId.trim());
    Object.values(obj).forEach((item) => collectKycFileIds(item, out, depth + 1));
  }
}

async function unlinkKycRecord(file: { storagePath?: string }): Promise<void> {
  try {
    if (file.storagePath && fs.existsSync(file.storagePath)) {
      const root = path.resolve(process.cwd(), 'uploads');
      const resolved = path.resolve(file.storagePath);
      if (resolved.startsWith(root)) fs.unlinkSync(resolved);
    }
  } catch (error) {
    console.warn('KYC unlink failed:', (error as Error).message);
  }
}

async function purgeDpr(dpr: any): Promise<void> {
  const dprId = dpr._id.toString();
  const projectId = dpr.projectId?.toString();
  const snapshot = dpr.toObject ? dpr.toObject() : dpr;
  const publicIds = new Set<string>();
  collectPublicIds(snapshot, publicIds);
  for (const publicId of publicIds) {
    try {
      await CloudinaryService.deleteDocument(publicId);
    } catch {
      /* keep going */
    }
  }
  const fileIds = new Set<string>();
  collectKycFileIds(snapshot, fileIds);
  if (projectId) {
    const project = await Project.findById(projectId).lean();
    collectKycFileIds((project as any)?.images, fileIds);
  }
  if (fileIds.size) {
    const files = await KycFile.find({ _id: { $in: Array.from(fileIds) } });
    for (const file of files) await unlinkKycRecord(file);
    await KycFile.deleteMany({ _id: { $in: Array.from(fileIds) } });
  }
  if (projectId) {
    const leftover = await KycFile.find({ projectId });
    for (const file of leftover) await unlinkKycRecord(file);
    await KycFile.deleteMany({ projectId });
  }
  await ClusterSection.deleteMany({ dprId });
  await DPRVersion.findByIdAndDelete(dprId);
  if (projectId) {
    const remaining = await DPRVersion.countDocuments({ projectId });
    if (remaining === 0) {
      await Project.findByIdAndDelete(projectId);
    }
  }
}

/**
 * Warn, then delete idle DPRs (draft, submitted, or approved).
 * Clock is last edit of that DPR, not first save and not last login.
 * Never deletes the user account.
 */
export async function runRetentionJob(): Promise<RetentionResult> {
  const idleDays = retentionIdleDays();
  const warningDays = retentionWarningDays();
  const auditDays = auditRetentionDays();
  const dayMs = 24 * 60 * 60 * 1000;
  const warnAgeDays = Math.max(0, idleDays - warningDays);
  const warnAgeBefore = new Date(Date.now() - warnAgeDays * dayMs);
  const idleBefore = new Date(Date.now() - idleDays * dayMs);
  const warningElapsedBefore = new Date(Date.now() - warningDays * dayMs);

  const result: RetentionResult = {
    warned: 0,
    purged: 0,
    auditPurged: 0,
    idleDays,
    warningDays,
    auditDays,
    details: [],
  };

  // No status filter: submitted copies use the same last-edit clock as drafts.
  const idle = await DPRVersion.find({ updatedAt: { $lte: warnAgeBefore } });

  for (const dpr of idle) {
    const userId = dpr.userId?.toString();
    const dprId = dpr._id.toString();
    const warnedAt = dpr.retentionWarningAt as Date | undefined;

    if (!warnedAt) {
      // Do not touch updatedAt — that would reset the idle clock.
      await DPRVersion.updateOne(
        { _id: dpr._id },
        { $set: { retentionWarningAt: new Date() } },
        { timestamps: false }
      );
      const user = userId
        ? await User.findById(userId).select('email phoneNumber name')
        : null;
      const step1 = dpr.content?.english?.clusterData?.step1;
      const projectName =
        step1?.unitName ||
        step1?.clusterName ||
        dpr.content?.english?.clusterData?.unitName ||
        'your DPR draft';
      const title = `Your DPR will be deleted in ${warningDays} days`;
      const body = `Hello${user?.name ? ` ${user.name}` : ''}. You have not edited “${projectName}” for ${warnAgeDays} days. We will delete that report (not your account) in ${warningDays} days unless you open and save it.`;
      if (userId) {
        await NotifyService.notify({
          userId,
          kind: 'retention_warning',
          title,
          body,
          phone: user?.phoneNumber,
          email: user?.email,
          targetType: 'dpr',
          targetId: dprId,
        });
      }
      await AuditService.log({
        action: 'retention_warning',
        userId,
        targetType: 'dpr',
        targetId: dprId,
      });
      result.warned += 1;
      result.details.push({ dprId, action: 'warn', userId });
      continue;
    }

    if (new Date(warnedAt) > warningElapsedBefore) {
      continue;
    }

    if (!dpr.updatedAt || dpr.updatedAt > idleBefore) {
      continue;
    }

    await purgeDpr(dpr);
    await AuditService.log({
      action: 'retention_purge',
      userId,
      targetType: 'dpr',
      targetId: dprId,
    });
    result.purged += 1;
    result.details.push({ dprId, action: 'purge', userId });
  }

  const auditCutoff = new Date(Date.now() - auditDays * dayMs);
  // The only place audit rows are removed; it keeps an anchor so the hash chain still verifies.
  result.auditPurged = await purgeAuditEvents(auditCutoff);
  if (result.auditPurged) {
    console.info(`[retention] erased ${result.auditPurged} audit rows older than ${auditDays} days`);
  }

  return result;
}
