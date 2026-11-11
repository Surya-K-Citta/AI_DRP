import { RefreshSession } from '../models/RefreshSession.model';
import fs from 'fs';
import path from 'path';
import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { ClusterSection } from '../models/ClusterSection.model';
import { Feedback } from '../models/Feedback.model';
import { SchemeMatch } from '../models/SchemeMatch.model';
import { DPRSession } from '../models/DPRSession.model';
import { DPRAnalytics } from '../models/DPRAnalytics.model';
import { Document } from '../models/Document.model';
import { KycFile } from '../models/KycFile.model';
import { UserNotification } from '../models/UserNotification.model';
import { CloudinaryService } from './cloudinary.service';

export type EraseResult = {
  projects: number;
  dprs: number;
  sections: number;
  documents: number;
  filesAttempted: number;
  warnings: string[];
};

type FileRefs = {
  publicIds: Set<string>;
  localPaths: Set<string>;
  openaiFileIds: Set<string>;
};

function collectFileRefs(value: unknown, out: FileRefs, depth = 0): void {
  if (value == null || depth > 12) return;
  if (typeof value === 'string') {
    if (/res\.cloudinary\.com/i.test(value)) {
      const match = value.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (match?.[1]) out.publicIds.add(match[1]);
    }
    if (value.includes('/uploads/')) {
      const idx = value.indexOf('/uploads/');
      out.localPaths.add(value.slice(idx));
    }
    if (/^file-[a-zA-Z0-9]+$/.test(value)) {
      out.openaiFileIds.add(value);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectFileRefs(item, out, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.cloudinaryPublicId === 'string' && obj.cloudinaryPublicId.trim()) {
      out.publicIds.add(obj.cloudinaryPublicId.trim());
    }
    if (typeof obj.openaiFileId === 'string' && obj.openaiFileId.trim()) {
      out.openaiFileIds.add(obj.openaiFileId.trim());
    }
    if (typeof obj.filePath === 'string') {
      collectFileRefs(obj.filePath, out, depth + 1);
    }
    Object.values(obj).forEach((item) => collectFileRefs(item, out, depth + 1));
  }
}

function safeUnlink(filePath: string, warnings: string[]): void {
  try {
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const relative = filePath.replace(/^\/+/, '');
    const resolved = path.isAbsolute(filePath)
      ? path.resolve(filePath)
      : path.resolve(process.cwd(), relative);
    if (!resolved.startsWith(uploadsRoot)) return;
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  } catch (error) {
    warnings.push(`Local file skip: ${filePath} (${(error as Error).message})`);
  }
}

async function destroyCloudinary(publicId: string, warnings: string[]): Promise<void> {
  try {
    const ok = await CloudinaryService.deleteDocument(publicId);
    if (!ok) {
      await CloudinaryService.deleteImage(publicId);
    }
  } catch (error) {
    warnings.push(`Cloudinary skip ${publicId}: ${(error as Error).message}`);
  }
}

async function destroyOpenAiFile(fileId: string, warnings: string[]): Promise<void> {
  try {
    const { openai } = await import('../lib/openaiClient');
    await openai.files.del(fileId);
  } catch (error) {
    warnings.push(`OpenAI file skip ${fileId}: ${(error as Error).message}`);
  }
}

/**
 * Wipe one person's product data. Audit rows stay.
 */
export async function eraseAccount(userId: string): Promise<EraseResult> {
  const uid = userId.toString();
  const warnings: string[] = [];
  const refs: FileRefs = {
    publicIds: new Set(),
    localPaths: new Set(),
    openaiFileIds: new Set(),
  };

  const projects = await Project.find({ userId: uid });
  const projectIds = projects.map((p) => p._id.toString());

  const dprs = await DPRVersion.find({
    $or: [{ userId: uid }, { projectId: { $in: projectIds } }],
  });
  const dprIds = dprs.map((d) => d._id.toString());

  projects.forEach((p) => collectFileRefs(p.toObject(), refs));
  dprs.forEach((d) => collectFileRefs(d.toObject(), refs));

  const documents = await Document.find({
    uploadedBy: uid,
    'metadata.isTemplate': { $ne: true },
  });
  const kycFiles = await KycFile.find({ userId: uid });
  kycFiles.forEach((file) => {
    if (file.storagePath) refs.localPaths.add(file.storagePath);
  });
  documents.forEach((doc) => {
    collectFileRefs(doc.toObject(), refs);
    if (doc.filePath) refs.localPaths.add(doc.filePath);
    if (doc.openaiFileId) refs.openaiFileIds.add(doc.openaiFileId);
  });

  const filesAttempted =
    refs.publicIds.size + refs.localPaths.size + refs.openaiFileIds.size;

  for (const publicId of refs.publicIds) {
    await destroyCloudinary(publicId, warnings);
  }
  for (const localPath of refs.localPaths) {
    safeUnlink(localPath, warnings);
  }
  for (const fileId of refs.openaiFileIds) {
    await destroyOpenAiFile(fileId, warnings);
  }

  const sections = await ClusterSection.deleteMany({
    $or: [{ userId: uid }, { dprId: { $in: dprIds } }],
  });
  await Feedback.deleteMany({ userId: uid });
  if (projectIds.length) {
    await SchemeMatch.deleteMany({ projectId: { $in: projectIds } });
    await DPRAnalytics.deleteMany({
      $or: [{ projectId: { $in: projectIds } }, { dprId: { $in: dprIds } }],
    });
  }
  await DPRSession.deleteMany({ userId: uid });
  await Document.deleteMany({
    uploadedBy: uid,
    'metadata.isTemplate': { $ne: true },
  });
  await KycFile.deleteMany({ userId: uid });
  await RefreshSession.deleteMany({ userId: uid });
  await UserNotification.deleteMany({ userId: uid });
  await DPRVersion.deleteMany({
    $or: [{ userId: uid }, { projectId: { $in: projectIds } }],
  });
  await Project.deleteMany({ userId: uid });
  await User.findByIdAndDelete(uid);

  return {
    projects: projects.length,
    dprs: dprs.length,
    sections: sections.deletedCount || 0,
    documents: documents.length,
    filesAttempted,
    warnings,
  };
}
