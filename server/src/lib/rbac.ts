/**
 * Three roles:
 *  - entrepreneur: creates and owns DPRs.
 *  - officer:      District Reviewer. Reads and reviews submitted DPRs from the district they are assigned to.
 *  - admin:        APMSMEDC Admin. Everything, across all districts, including user management.
 * Roles are only ever changed by an admin (never by registration or profile edits).
 */
export const ROLES = ['entrepreneur', 'officer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  entrepreneur: 'Entrepreneur',
  officer: 'District Reviewer',
  admin: 'APMSMEDC Admin',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Lower-case letters and digits only, so "Visakhapatnam " and "visakhapatnam" match. */
export function normaliseDistrict(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function sameDistrict(a: unknown, b: unknown): boolean {
  const x = normaliseDistrict(a);
  return x.length > 0 && x === normaliseDistrict(b);
}

/** District a project belongs to (Individual and Cluster DPR forms both store it on step 1). */
export function projectDistrict(project: any): string {
  if (!project) return '';
  const fromSteps = project.stepData?.step1?.district;
  const fromProject = project.district ?? project.inputs?.district;
  return String(fromSteps || fromProject || '').trim();
}

export type StaffScope = { role?: string; reviewDistrict?: string | null };

/** Admin sees every district. A District Reviewer sees only the district they are assigned to. */
export function staffMayAccessProject(scope: StaffScope, project: any): boolean {
  if (scope.role === 'admin') return true;
  if (scope.role === 'officer') return sameDistrict(scope.reviewDistrict, projectDistrict(project));
  return false;
}
