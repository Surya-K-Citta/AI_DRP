export type AppRole = 'super_admin' | 'consultant' | 'govt_official';

export const APP_ROLES: AppRole[] = ['super_admin', 'consultant', 'govt_official'];

const LEGACY_TO_APP: Record<string, AppRole> = {
  admin: 'super_admin',
  entrepreneur: 'consultant',
  officer: 'govt_official',
  user: 'consultant',
  super_admin: 'super_admin',
  consultant: 'consultant',
  govt_official: 'govt_official',
};

export function toAppRole(role?: string | null): AppRole {
  if (!role) return 'consultant';
  return LEGACY_TO_APP[role] || 'consultant';
}

/** Maps UI roles onto the current backend enum without a schema change. */
export function toBackendRole(role: AppRole): 'admin' | 'entrepreneur' | 'officer' {
  if (role === 'super_admin') return 'admin';
  if (role === 'govt_official') return 'officer';
  return 'entrepreneur';
}

export function isSuperAdmin(role?: string | null): boolean {
  return toAppRole(role) === 'super_admin';
}

export function canCreateDpr(role?: string | null): boolean {
  const appRole = toAppRole(role);
  return appRole === 'consultant' || appRole === 'super_admin';
}

export function canAccessAdmin(role?: string | null): boolean {
  return isSuperAdmin(role);
}

export const ROLE_META: Record<
  AppRole,
  {
    labelKey: string;
    descriptionKey: string;
    permissionKeys: string[];
    accent: string;
    badge: string;
  }
> = {
  super_admin: {
    labelKey: 'rbac.roles.super_admin.label',
    descriptionKey: 'rbac.roles.super_admin.description',
    permissionKeys: [
      'rbac.roles.super_admin.p1',
      'rbac.roles.super_admin.p2',
      'rbac.roles.super_admin.p3',
      'rbac.roles.super_admin.p4',
      'rbac.roles.super_admin.p5',
    ],
    accent: 'border-violet-300 bg-violet-50 hover:border-violet-400',
    badge: 'bg-violet-100 text-violet-800',
  },
  consultant: {
    labelKey: 'rbac.roles.consultant.label',
    descriptionKey: 'rbac.roles.consultant.description',
    permissionKeys: [
      'rbac.roles.consultant.p1',
      'rbac.roles.consultant.p2',
      'rbac.roles.consultant.p3',
      'rbac.roles.consultant.p4',
      'rbac.roles.consultant.p5',
    ],
    accent: 'border-sky-300 bg-sky-50 hover:border-sky-400',
    badge: 'bg-sky-100 text-sky-800',
  },
  govt_official: {
    labelKey: 'rbac.roles.govt_official.label',
    descriptionKey: 'rbac.roles.govt_official.description',
    permissionKeys: [
      'rbac.roles.govt_official.p1',
      'rbac.roles.govt_official.p2',
      'rbac.roles.govt_official.p3',
      'rbac.roles.govt_official.p4',
      'rbac.roles.govt_official.p5',
    ],
    accent: 'border-emerald-300 bg-emerald-50 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800',
  },
};
