/**
 * Scheme-specific UI / live-DPR templates.
 * Only PMEGP and AP CMEP have distinct skins for now; others use the default shell.
 */

type SchemeUiTemplateId = 'PMEGP' | 'AP_CMEP';

type SchemeUiTemplate = {
  id: SchemeUiTemplateId;
  /** Short badge on form banner + document cover */
  badge: string;
  /** One-line pack description under the badge */
  tagline: string;
  /** Sticky form banner */
  bannerClass: string;
  /** Active step chip */
  stepActiveClass: string;
  /** Idle step chip accent (border/text) */
  stepIdleClass: string;
  /** Form card shell */
  formShellClass: string;
  /** Live preview / PDF document root modifier */
  documentClass: string;
  /** Cover kicker override */
  coverKicker: string;
};

const TEMPLATES: Record<SchemeUiTemplateId, SchemeUiTemplate> = {
  PMEGP: {
    id: 'PMEGP',
    badge: 'PMEGP · KVIC unit pack',
    tagline: 'Credit-linked margin money · bank-style single-unit DPR',
    bannerClass: 'scheme-banner scheme-banner-pmegp border-b border-teal-300/80',
    stepActiveClass: 'bg-teal-800 text-white shadow-sm ring-1 ring-teal-900/20',
    stepIdleClass: 'border border-teal-200/80 text-teal-900 bg-teal-50/40 hover:bg-teal-50',
    formShellClass:
      'scheme-tpl-pmegp border-teal-300/70 shadow-md shadow-teal-900/5 ring-1 ring-teal-900/5',
    documentClass: 'tpl-pmegp',
    coverKicker: 'PMEGP DETAILED PROJECT REPORT',
  },
  AP_CMEP: {
    id: 'AP_CMEP',
    badge: 'AP CMEP · State credit-linked',
    tagline: 'Andhra Pradesh CMEP · bank loan required · manufacturing / knowledge',
    bannerClass: 'scheme-banner scheme-banner-ap-cmep border-b border-indigo-300/80',
    stepActiveClass: 'bg-indigo-900 text-white shadow-sm ring-1 ring-indigo-950/20',
    stepIdleClass: 'border border-indigo-200/80 text-indigo-950 bg-indigo-50/40 hover:bg-indigo-50',
    formShellClass:
      'scheme-tpl-ap-cmep border-indigo-300/70 shadow-md shadow-indigo-900/5 ring-1 ring-indigo-950/5',
    documentClass: 'tpl-ap-cmep',
    coverKicker: 'AP CMEP DETAILED PROJECT REPORT',
  },
};

export function getSchemeUiTemplate(schemeCode?: string | null): SchemeUiTemplate | null {
  if (schemeCode === 'PMEGP' || schemeCode === 'AP_CMEP') {
    return TEMPLATES[schemeCode];
  }
  return null;
}
