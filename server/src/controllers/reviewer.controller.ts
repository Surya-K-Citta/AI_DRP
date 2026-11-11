// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../types';
import { Project } from '../models/Project.model';
import { DPRVersion } from '../models/DPRVersion.model';
import { User } from '../models/User.model';
import { AuditService } from '../services/audit.service';
import { projectDistrict, sameDistrict, staffMayAccessProject } from '../lib/rbac';

const REVIEWABLE = ['submitted', 'approved', 'rejected'];

function scopeOf(req: AuthRequest) {
  return { role: req.user?.role, reviewDistrict: req.user?.reviewDistrict || null };
}

async function visibleProjects(req: AuthRequest, districtFilter?: string) {
  const scope = scopeOf(req);
  const projects: any[] = await Project.find({})
    .select('projectName projectType location userId stepData district inputs')
    .lean();
  return projects.filter((project) => {
    if (!staffMayAccessProject(scope, project)) return false;
    return districtFilter ? sameDistrict(districtFilter, projectDistrict(project)) : true;
  });
}

function row(dpr: any, project: any, applicant: any) {
  return {
    dprId: String(dpr._id),
    projectId: String(dpr.projectId),
    projectName: project?.projectName,
    projectType: project?.projectType,
    district: projectDistrict(project),
    location: project?.location,
    status: dpr.status,
    submittedAt: dpr.submittedAt,
    qualityScore: dpr.qualityScore,
    applicant: applicant ? { name: applicant.name, email: applicant.email, phoneNumber: applicant.phoneNumber } : undefined,
    review: dpr.review,
  };
}

export class ReviewerController {
  /** Queue of DPRs from the reviewer's district (admin: all districts, optionally filtered). */
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const status = String(req.query.status || 'submitted');
      if (status !== 'all' && !REVIEWABLE.includes(status)) {
        res.status(400).json({ success: false, message: `status must be one of: all, ${REVIEWABLE.join(', ')}` });
        return;
      }
      const districtFilter = req.user?.role === 'admin' && req.query.district ? String(req.query.district) : undefined;
      const projects = await visibleProjects(req, districtFilter);
      const byId = new Map(projects.map((p) => [String(p._id), p]));
      const dprs: any[] = await DPRVersion.find({
        projectId: { $in: [...byId.keys()] },
        status: status === 'all' ? { $in: REVIEWABLE } : status,
      })
        .select('-content -financials -eligibleSchemes')
        .sort({ submittedAt: -1, updatedAt: -1 })
        .limit(200)
        .lean();
      const users: any[] = await User.find({ _id: { $in: [...new Set(dprs.map((d) => d.userId).filter(Boolean))] } })
        .select('name email phoneNumber')
        .lean();
      const userById = new Map(users.map((u) => [String(u._id), u]));
      res.status(200).json({
        success: true,
        data: {
          district: req.user?.role === 'officer' ? req.user?.reviewDistrict : districtFilter || null,
          dprs: dprs.map((d) => row(d, byId.get(String(d.projectId)), userById.get(String(d.userId)))),
        },
      });
    } catch (error: any) {
      console.error('Reviewer list error:', error);
      res.status(500).json({ success: false, message: 'Failed to load the review queue' });
    }
  }

  /** Counts per status for the reviewer's district. */
  static async summary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const projects = await visibleProjects(req);
      const counts = { submitted: 0, approved: 0, rejected: 0 };
      const grouped: any[] = await DPRVersion.aggregate([
        { $match: { projectId: { $in: projects.map((p) => String(p._id)) }, status: { $in: REVIEWABLE } } },
        { $group: { _id: '$status', n: { $sum: 1 } } },
      ]);
      grouped.forEach((g) => { counts[g._id] = g.n; });
      res.status(200).json({ success: true, data: { district: req.user?.reviewDistrict || null, counts } });
    } catch (error: any) {
      console.error('Reviewer summary error:', error);
      res.status(500).json({ success: false, message: 'Failed to load the summary' });
    }
  }

  static async loadScoped(req: AuthRequest, res: Response) {
    const dpr: any = await DPRVersion.findById(req.params.id);
    if (!dpr) {
      res.status(404).json({ success: false, message: 'DPR not found' });
      return null;
    }
    const project: any = await Project.findById(dpr.projectId).lean();
    if (!staffMayAccessProject(scopeOf(req), project)) {
      await AuditService.log({
        action: 'access_denied',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'dpr',
        targetId: String(dpr._id),
        req,
      });
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Forbidden: this DPR is outside your district',
      });
      return null;
    }
    return { dpr, project };
  }

  static async detail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const found = await ReviewerController.loadScoped(req, res);
      if (!found) return;
      const { dpr, project } = found;
      const applicant: any = await User.findById(dpr.userId).select('name email phoneNumber').lean();
      await AuditService.log({
        action: 'admin_view',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'dpr',
        targetId: String(dpr._id),
        req,
      });
      res.status(200).json({
        success: true,
        data: { ...row(dpr, project, applicant), content: dpr.content, financials: dpr.financials },
      });
    } catch (error: any) {
      console.error('Reviewer detail error:', error);
      res.status(500).json({ success: false, message: 'Failed to load the DPR' });
    }
  }

  static async review(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { decision, remarks } = req.body || {};
      if (decision !== 'approve' && decision !== 'reject') {
        res.status(400).json({ success: false, message: "decision must be 'approve' or 'reject'" });
        return;
      }
      const note = String(remarks || '').trim().slice(0, 2000);
      if (decision === 'reject' && !note) {
        res.status(400).json({ success: false, message: 'Remarks are required when sending a DPR back' });
        return;
      }
      const found = await ReviewerController.loadScoped(req, res);
      if (!found) return;
      const { dpr, project } = found;
      if (dpr.status !== 'submitted') {
        res.status(409).json({ success: false, message: `Only submitted DPRs can be reviewed (this one is ${dpr.status})` });
        return;
      }
      const reviewer: any = await User.findById(req.user?.userId).select('name').lean();
      dpr.status = decision === 'approve' ? 'approved' : 'rejected';
      if (decision === 'approve') {
        dpr.approvedAt = new Date();
        dpr.approvedBy = req.user?.userId;
      }
      dpr.review = {
        decision,
        remarks: note,
        reviewerId: req.user?.userId,
        reviewerName: reviewer?.name,
        district: projectDistrict(project),
        reviewedAt: new Date(),
      };
      dpr.markModified('review');
      await dpr.save();
      await AuditService.log({
        action: 'dpr_review',
        userId: req.user?.userId,
        role: req.user?.role,
        targetType: 'dpr',
        targetId: `${dpr._id}:${decision}`,
        req,
      });
      res.status(200).json({ success: true, message: decision === 'approve' ? 'DPR approved' : 'DPR sent back to the applicant', data: { dprId: String(dpr._id), status: dpr.status, review: dpr.review } });
    } catch (error: any) {
      console.error('Reviewer review error:', error);
      res.status(500).json({ success: false, message: 'Failed to record the review' });
    }
  }
}
