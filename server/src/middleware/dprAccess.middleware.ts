// @ts-nocheck
import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import { DPRVersion } from '../models/DPRVersion.model';
import { Project } from '../models/Project.model';
import { loadStaffScope } from '../lib/staffScope';
import { staffMayAccessProject } from '../lib/rbac';

/**
 * Runs for every route with a :dprId in it. The owner may do anything. Staff may read (GET and the document
 * exports) only inside their scope: a District Reviewer's own district, or any district for an admin.
 * Everyone else gets 403, and an unknown or malformed id gets 404.
 */
export async function dprParamGuard(req: AuthRequest, res: Response, next: NextFunction, dprId: string): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!mongoose.isValidObjectId(dprId)) {
      res.status(404).json({ success: false, message: 'DPR not found' });
      return;
    }
    const dpr: any = await DPRVersion.findById(dprId).select('projectId userId').lean();
    if (!dpr) {
      res.status(404).json({ success: false, message: 'DPR not found' });
      return;
    }
    if (String(dpr.userId) === String(userId)) return next();
    const project: any = await Project.findById(dpr.projectId).select('userId stepData district inputs').lean();
    if (project && String(project.userId) === String(userId)) return next();

    const readOnly = req.method === 'GET' || req.method === 'HEAD' || /\/download\//.test(req.path);
    if (readOnly && project && staffMayAccessProject(await loadStaffScope(userId), project)) return next();

    res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Forbidden: this DPR does not belong to you' });
  } catch (error) {
    next(error);
  }
}
