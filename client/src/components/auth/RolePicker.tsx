import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Landmark, Shield, UserCog } from 'lucide-react';
import { APP_ROLES, ROLE_META, toAppRole, type AppRole } from '@/lib/rbac';

const ROLE_ICONS: Record<AppRole, React.ElementType> = {
  super_admin: Shield,
  consultant: UserCog,
  govt_official: Landmark,
};

interface RolePickerProps {
  value: AppRole;
  onChange: (role: AppRole) => void;
  roles?: AppRole[];
}

export const RolePicker: React.FC<RolePickerProps> = ({
  value,
  onChange,
  roles = APP_ROLES,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{t('rbac.selectRole')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {roles.map((role) => {
          const meta = ROLE_META[role];
          const Icon = ROLE_ICONS[role];
          const selected = value === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              className={`relative text-left rounded-xl border-2 p-4 transition-all ${meta.accent} ${
                selected ? 'ring-2 ring-primary ring-offset-2' : 'opacity-90'
              }`}
            >
              {selected && (
                <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-primary" />
              )}
              <Icon className="h-5 w-5 mb-2 text-foreground" />
              <p className="font-semibold text-sm">{t(meta.labelKey)}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {t(meta.descriptionKey)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const RoleBadge: React.FC<{ role?: string | null; className?: string }> = ({
  role,
  className = '',
}) => {
  const { t } = useTranslation();
  const appRole = toAppRole(role);
  const meta = ROLE_META[appRole];

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${meta.badge} ${className}`}>
      {t(meta.labelKey)}
    </span>
  );
};
