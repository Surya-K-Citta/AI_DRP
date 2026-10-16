import { User } from '../models/User.model';
import { Project } from '../models/Project.model';
import { projectDistrict, sameDistrict, staffMayAccessProject, StaffScope } from './rbac';

/** Current role and assigned district, read from the database (the token may be stale). */
export async function loadStaffScope(userId?: string): Promise<StaffScope> {
  if (!userId) return {};
  const user: any = await User.findById(userId).select('role reviewDistrict').lean();
  return { role: user?.role, reviewDistrict: user?.reviewDistrict || null };
}

/** Whether this staff member may read this project's DPRs. Admin: all. Reviewer: own district only. */
export async function staffMayViewProject(userId: string | undefined, project: any): Promise<boolean> {
  return staffMayAccessProject(await loadStaffScope(userId), project);
}

/** Whether a reviewer may read files uploaded by this user (user has a project in the reviewer's district). */
export async function staffMayViewUserFiles(staffUserId: string | undefined, ownerUserId: string): Promise<boolean> {
  const scope = await loadStaffScope(staffUserId);
  if (scope.role === 'admin') return true;
  if (scope.role !== 'officer' || !scope.reviewDistrict) return false;
  const projects: any[] = await Project.find({ userId: ownerUserId }).select('stepData district inputs').lean();
  return projects.some((project) => sameDistrict(scope.reviewDistrict, projectDistrict(project)));
}
