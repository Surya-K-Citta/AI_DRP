import { useEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Entry = { key: string; path: string };

let entries: Entry[] = [];
let index = -1;
let lastKey = '';

/** Screens people do not "go back to" (sign-in pages, the bare landing page). */
const SKIP_PATHS = new Set(['/login', '/register']);

const PAGES: Array<[RegExp, string, string]> = [
  [/^\/dashboard$/, 'dashboard', 'Dashboard'],
  [/^\/venture-match$/, 'schemeFinder', 'Scheme Finder'],
  [/^\/projects\/create$/, 'newProject', 'New Project'],
  [/^\/projects\/[^/]+$/, 'project', 'Project'],
  [/^\/projects$/, 'projects', 'Projects'],
  [/^\/dpr\/builder(\/.*)?$/, 'dprBuilder', 'DPR Builder'],
  [/^\/dpr\/view\/[^/]+$/, 'dprView', 'DPR'],
  [/^\/dpr\/[^/]+$/, 'dprGeneration', 'DPR Generation'],
  [/^\/dprs$/, 'allDprs', 'All DPRs'],
  [/^\/cluster-dpr\/create$/, 'clusterDpr', 'Cluster DPR'],
  [/^\/individual-dpr\/guide$/, 'reportGuide', 'Report setup'],
  [/^\/individual-dpr\/create$/, 'createDpr', 'Create DPR'],
  [/^\/chat$/, 'chat', 'Chat'],
  [/^\/profile$/, 'profile', 'Profile'],
  [/^\/account\/privacy$/, 'accountPrivacy', 'Privacy settings'],
  [/^\/admin\/documents$/, 'adminDocuments', 'Documents'],
  [/^\/reviewer$/, 'review', 'District review'],
  [/^\/admin$/, 'admin', 'Admin'],
  [/^\/$/, 'home', 'Home'],
];

function pageOf(path: string): { id: string; fallback: string } | null {
  const hit = PAGES.find(([pattern]) => pattern.test(path));
  return hit ? { id: hit[1], fallback: hit[2] } : null;
}

/** Remembers the screens the person walked through, so Back can name and return to the one they came from. */
export function RouteTracker() {
  const location = useLocation();
  const type = useNavigationType();
  if (location.key !== lastKey) {
    lastKey = location.key;
    const entry = { key: location.key, path: location.pathname };
    if (type === 'PUSH') {
      entries = entries.slice(0, index + 1);
      entries.push(entry);
      index = entries.length - 1;
    } else if (type === 'REPLACE') {
      if (index < 0) {
        entries = [entry];
        index = 0;
      } else {
        entries[index] = entry;
      }
    } else {
      const found = entries.findIndex((item) => item.key === entry.key);
      if (found >= 0) {
        index = found;
      } else {
        entries = [entry];
        index = 0;
      }
    }
  }
  return null;
}

/**
 * Back button target: the screen the person came from (named, e.g. "Back to Scheme Finder"),
 * or the given fallback when the page was opened directly.
 */
export function useBackTarget(fallback: { path: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  let from: { path: string; steps: number } | null = null;
  if (entries[index]?.key === location.key) {
    for (let i = index - 1; i >= 0; i -= 1) {
      const candidate = entries[i];
      if (candidate.path !== location.pathname && !SKIP_PATHS.has(candidate.path) && pageOf(candidate.path)) {
        from = { path: candidate.path, steps: index - i };
        break;
      }
    }
  }

  const targetPath = from ? from.path : fallback.path;
  const page = pageOf(targetPath);
  const name = page ? t(`nav.pages.${page.id}`, { defaultValue: page.fallback }) : '';
  const label = name ? t('nav.backTo', { name, defaultValue: `Back to ${name}` }) : t('common.back');

  return {
    label,
    /** True when Back returns to the screen the person came from rather than the fallback. */
    fromHistory: Boolean(from),
    go: () => {
      if (from) navigate(-from.steps);
      else navigate(fallback.path);
    },
  };
}

/** A new screen opens at its top. Going Back or Forward leaves the browser's own scroll position alone. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if (type === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, type]);
  return null;
}
