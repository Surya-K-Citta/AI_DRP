/** Rupee fields the model must not invent when earlier steps state no amount. */
const COST_FIELDS = new Set([
  'land',
  'building',
  'machinery',
  'utilitiesAndInfrastructure',
  'preliminaryAndPreOperative',
  'workingCapitalMargin',
  'furniture',
  'securityDeposits',
  'spvContribution',
  'governmentGrant',
  'bankLoan',
  'otherSources',
  'rawMaterialCost',
  'powerCost',
  'wages',
  'maintenance',
  'administrativeExpenses',
  'marketingExpenses',
  'annualSalesRealization',
]);

export function isCostSuggestionField(field: string): boolean {
  return COST_FIELDS.has(field);
}

/** True when earlier answers already contain a rupee or lakh figure. */
function previousStepsMentionMoney(previous: unknown): boolean {
  const text = JSON.stringify(previous || {});
  if (/\d+(?:\.\d+)?\s*(lakh|lakhs|₹|rs\.?|rupees)/i.test(text)) return true;
  return /"(land|building|machinery|workingCapitalMargin|workingCapital|bankLoan|unitCost|investmentPerUnit|turnoverPerUnit|spvContribution|governmentGrant)"\s*:\s*[1-9]/.test(
    text
  );
}

/** Keep a stated amount. If nothing was stated, the suggestion is 0 rather than a made-up cost. */
export function groundCostSuggestion(field: string, suggestion: string, previous: unknown): string {
  if (!isCostSuggestionField(field)) return suggestion;
  if (previousStepsMentionMoney(previous)) return suggestion;
  return '0';
}
