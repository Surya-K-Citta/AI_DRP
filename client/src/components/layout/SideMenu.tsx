import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useLinkHandler } from '@/lib/linkUtils';
import { ChevronRight, ClipboardCheck, FileText, Files, FolderKanban, LayoutDashboard, MessageSquare, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { canAccessAdmin, canReview } from '@/lib/rbac';
import { DevModeToggle } from '@/components/ui/DevModeToggle';
import { useDevModeStore } from '@/store/devModeStore';

/** Dev mode only means something while building a DPR, so the switch shows on those pages. */
const DEV_MODE_PATHS = ['/individual-dpr/create', '/cluster-dpr/create'];

const COLLAPSED = 'w-16';
const EXPANDED = 'w-64';

function useFineHover() {
  const [fine, setFine] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const apply = () => setFine(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return fine;
}

/** The main places, shared by the side rail (tablet / desktop) and the phone menu. */
export function useAppNavLinks() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  return [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/dprs', label: t('nav.allDPRs'), icon: FileText },
    { path: '/projects', label: t('nav.projects'), icon: FolderKanban },
    { path: '/chat', label: t('nav.chat'), icon: MessageSquare },
    ...(canReview(user?.role) ? [{ path: '/reviewer', label: t('nav.review'), icon: ClipboardCheck }] : []),
    ...(canAccessAdmin(user?.role)
      ? [
          { path: '/admin', label: t('nav.admin'), icon: Settings },
          { path: '/admin/documents', label: t('nav.documents'), icon: Files },
        ]
      : []),
  ];
}

/** Icon rail under the header on tablet and desktop. Phones use the menu in the top bar instead. Hover (or tap) expands it over the page. */
export const SideMenu: React.FC = () => {
  const { t } = useTranslation();
  const tf = useClusterFormText();
  const location = useLocation();
  const handleLinkClick = useLinkHandler();
  const fineHover = useFineHover();
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || pinned;

  const devMode = useDevModeStore((s) => s.on);
  const setDevMode = useDevModeStore((s) => s.setOn);
  const showDevMode = DEV_MODE_PATHS.includes(location.pathname.replace(/\/$/, ''));
  const links = useAppNavLinks();

  useEffect(() => {
    setPinned(false);
    setHover(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinned(false);
        setHover(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (path: string) => {
    const current = location.pathname.replace(/\/$/, '') || '/';
    const target = path.replace(/\/$/, '') || '/';
    if (current === target) return true;
    if (!current.startsWith(`${target}/`)) return false;
    return !links.some((link) => {
      const other = link.path.replace(/\/$/, '') || '/';
      return other !== target && other.length > target.length && (current === other || current.startsWith(`${other}/`));
    });
  };

  return (
    <>
      {pinned && (
        <button
          type="button"
          aria-label={t('common.close', { defaultValue: 'Close' })}
          className="fixed inset-0 top-16 z-[60] bg-black/20"
          onClick={() => setPinned(false)}
        />
      )}
      <nav
        aria-label={t('nav.dashboard')}
        onMouseEnter={() => {
          if (fineHover) setHover(true);
        }}
        onMouseLeave={() => {
          if (fineHover) {
            setHover(false);
            setPinned(false);
          }
        }}
        onFocus={() => setHover(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setHover(false);
          }
        }}
        className={`max-md:hidden fixed left-0 top-16 z-[60] flex h-[calc(100vh-4rem)] flex-col overflow-hidden border-r border-border bg-background/95 shadow-lg backdrop-blur transition-[width] duration-200 ease-out ${
          open ? EXPANDED : COLLAPSED
        }`}
      >
        <ul className="flex flex-col gap-1 p-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <li key={link.path}>
                <a
                  href={link.path}
                  title={link.label}
                  onClick={(event) => {
                    handleLinkClick(event, link.path);
                    setPinned(false);
                  }}
                  className={`flex h-11 items-center rounded-lg transition-colors ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <span className="flex h-11 w-12 shrink-0 items-center justify-center">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={`truncate pr-3 text-sm font-medium whitespace-nowrap ${
                      open ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    {link.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        {showDevMode && (
          <div className="mt-auto border-t border-border p-2">
            <DevModeToggle on={devMode} onChange={setDevMode} expanded={open} />
          </div>
        )}
        <button
          type="button"
          className={`mb-2 ${showDevMode ? '' : 'mt-auto'} flex h-11 w-12 items-center justify-center text-muted-foreground hover:text-foreground`}
          aria-expanded={open}
          aria-label={tf(open ? 'Collapse menu' : 'Expand menu')}
          onClick={() => setPinned((value) => !value)}
        >
          <ChevronRight className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </nav>
    </>
  );
};
