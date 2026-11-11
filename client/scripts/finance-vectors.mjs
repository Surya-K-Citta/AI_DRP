// Writes the scenarios the server's financeGuard must agree with. Run after changing finance/rules.ts:  npm run vectors
import { writeFileSync } from 'node:fs';
import { reviewFinance } from '../src/lib/finance/rules.ts';

const base = (over = {}) => ({
  matchedSchemeCode: null,
  step12: { land: 5, building: 15, machinery: 60, furniture: 5, preliminaryAndPreOperative: 5, workingCapitalMargin: 10 },
  step13: { spvContribution: 25, governmentGrant: 0, bankLoan: 75, otherSources: 0 },
  ...over,
});
const withStep13 = (step13, extra = {}) => base({ ...extra, step13: { spvContribution: 25, governmentGrant: 0, bankLoan: 75, otherSources: 0, ...step13 } });
const scenarios = {
  'balanced standard': base(),
  'funding short by 0.01': withStep13({ bankLoan: 74.99 }),
  'funding over by 5': withStep13({ bankLoan: 80 }),
  'equity 5% standard': withStep13({ spvContribution: 5, bankLoan: 95 }),
  'debt equity 3.17': withStep13({ spvContribution: 24, bankLoan: 76 }),
  'subsidy counts as equity': withStep13({ spvContribution: 10, governmentGrant: 15, bankLoan: 75 }),
  'no bank loan': withStep13({ spvContribution: 100, bankLoan: 0 }),
  'pmegp general 5%': withStep13({ spvContribution: 5, governmentGrant: 35, bankLoan: 60 }, { matchedSchemeCode: 'PMEGP', schemeExtras: { pmegpCategory: 'general' } }),
  'pmegp special 5%': withStep13({ spvContribution: 5, governmentGrant: 35, bankLoan: 60 }, { matchedSchemeCode: 'PMEGP', schemeExtras: { pmegpCategory: 'special' } }),
  'pmfme grant above cap': { matchedSchemeCode: 'PMFME', step12: { machinery: 20 }, step13: { spvContribution: 4, governmentGrant: 7.1, bankLoan: 8.9 } },
  'pmfme grant at cap': { matchedSchemeCode: 'PMFME', step12: { machinery: 20 }, step13: { spvContribution: 4, governmentGrant: 7, bankLoan: 9 } },
  'pmfme ten lakh ceiling': { matchedSchemeCode: 'PMFME', step12: { machinery: 100 }, step13: { spvContribution: 10, governmentGrant: 10.5, bankLoan: 79.5 } },
  'sclcss grant above cap': { matchedSchemeCode: 'SCLCSS', step12: { machinery: 200 }, step13: { spvContribution: 20, governmentGrant: 30, bankLoan: 150 } },
  'ap edp 75% of fci': { matchedSchemeCode: 'AP_EDP', step12: { machinery: 100 }, step13: { spvContribution: 10, governmentGrant: 76, bankLoan: 14 } },
  'mudra kishore 9 lakh': { matchedSchemeCode: 'MUDRA', schemeExtras: { mudraCategory: 'kishore' }, step12: { machinery: 8, workingCapitalMargin: 2 }, step13: { spvContribution: 1, bankLoan: 9 } },
  'mudra tarun 9.5 lakh': { matchedSchemeCode: 'MUDRA', schemeExtras: { mudraCategory: 'tarun' }, step12: { machinery: 8, workingCapitalMargin: 2 }, step13: { spvContribution: 0.5, bankLoan: 9.5 } },
  'vishwakarma first 3 lakh': { matchedSchemeCode: 'VISHWAKARMA', schemeExtras: { loanTranche: 'first' }, step12: { workingCapitalMargin: 3 }, step13: { bankLoan: 3 } },
  'vishwakarma second 2 lakh': { matchedSchemeCode: 'VISHWAKARMA', schemeExtras: { loanTranche: 'second' }, step12: { workingCapitalMargin: 2 }, step13: { bankLoan: 2 } },
  'svanidhi first 0.2 lakh': { matchedSchemeCode: 'SVANIDHI', schemeExtras: { loanTranche: 'first' }, step12: { workingCapitalMargin: 0.2 }, step13: { bankLoan: 0.2 } },
  'svanidhi third 0.5 lakh': { matchedSchemeCode: 'SVANIDHI', schemeExtras: { loanTranche: 'third' }, step12: { workingCapitalMargin: 0.5 }, step13: { bankLoan: 0.5 } },
  'standup 135 lakh': { matchedSchemeCode: 'STANDUP', step12: { machinery: 150 }, step13: { spvContribution: 15, bankLoan: 135 } },
  'standup 90% debt': { matchedSchemeCode: 'STANDUP', step12: { machinery: 50 }, step13: { spvContribution: 5, bankLoan: 45 } },
  'standup 10% equity 90% debt': { matchedSchemeCode: 'STANDUP', step12: { machinery: 50 }, step13: { spvContribution: 5, bankLoan: 45 } },
  'eclgs above quantum': { matchedSchemeCode: 'ECLGS', schemeExtras: { peakWcOutstanding: 100 }, step12: { workingCapitalMargin: 25 }, step13: { bankLoan: 25 } },
  'eclgs within quantum': { matchedSchemeCode: 'ECLGS', schemeExtras: { peakWcOutstanding: 100 }, step12: { workingCapitalMargin: 20 }, step13: { bankLoan: 20 } },
};
const out = Object.entries(scenarios).map(([name, data]) => ({
  name,
  data,
  blockers: reviewFinance(data).filter((f) => f.severity === 'block').map((f) => f.id).sort(),
}));
writeFileSync(new URL('../../server/src/financeGuard.vectors.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.length} scenarios`);
