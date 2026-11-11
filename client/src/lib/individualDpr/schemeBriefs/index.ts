import { AP_BRIEFS } from './ap';
import { CENTRAL_BRIEFS, VANILLA_BRIEF } from './central';
import { BriefLang, SchemeBrief } from './types';

export type { BriefLang, Loc, SchemeBrief, SchemeBriefTab, SchemeFaq, SchemeQuickInfo } from './types';
export { loc, loc as briefText } from './types';

const ALL: Record<string, SchemeBrief> = {
  ...CENTRAL_BRIEFS,
  ...AP_BRIEFS,
};

export function getSchemeBrief(code: string | null | undefined): SchemeBrief {
  if (!code) return VANILLA_BRIEF;
  return ALL[code] || VANILLA_BRIEF;
}

export function briefLangFromI18n(language: string | undefined): BriefLang {
  return language?.startsWith('te') ? 'te' : 'en';
}

