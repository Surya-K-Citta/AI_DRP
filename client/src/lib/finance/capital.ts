import { type CL, sumCL, toCL, fromCL } from './money.ts';

type AnyData = Record<string, any>;

/** What the project costs: assets, set-up costs and the money needed to run it. */
type CostComposition = {
  capex: { land: CL; building: CL; utilities: CL; machinery: CL; furniture: CL; deposits: CL; total: CL };
  preOperative: CL;
  /** Initial running expenses paid before sales start. Optional; 0 unless step 12 has `initialOpex`. */
  opex: CL;
  workingCapital: CL;
  total: CL;
};

/** Project cost from step 12. Every component is rounded to a hundredth of a lakh first, so the parts add up exactly. */
export function composeProjectCost(data: AnyData | null | undefined): CostComposition {
  const s = (data || {}).step12 || {};
  const land = toCL(s.land);
  const building = toCL(s.building);
  const utilities = toCL(s.utilitiesAndInfrastructure);
  const machinery = toCL(s.machinery);
  const furniture = toCL(s.furniture);
  const deposits = toCL(s.securityDeposits);
  const capexTotal = sumCL([land, building, utilities, machinery, furniture, deposits]);
  const preOperative = toCL(s.preliminaryAndPreOperative);
  const opex = toCL(s.initialOpex);
  const workingCapital = toCL(s.workingCapitalMargin);
  return {
    capex: { land, building, utilities, machinery, furniture, deposits, total: capexTotal },
    preOperative,
    opex,
    workingCapital,
    total: sumCL([capexTotal, preOperative, opex, workingCapital]),
  };
}

/** How the project is paid for. */
type FinancingComposition = {
  promoterEquity: CL;
  subsidy: CL;
  termLoan: CL;
  workingCapitalLoan: CL;
  other: CL;
  /** Bank money in total: term loan plus working capital loan. */
  debt: CL;
  total: CL;
};

/**
 * Means of finance from step 13. `bankLoan` is the bank money; the part that funds working capital
 * (`workingCapitalLoan`, default 0) is split out of it so the term loan and working capital loan add back to it.
 */
export function composeFinancing(data: AnyData | null | undefined): FinancingComposition {
  const s = (data || {}).step13 || {};
  const bank = toCL(s.bankLoan);
  const wcLoan = Math.min(Math.max(0, toCL(s.workingCapitalLoan)), Math.max(0, bank));
  const termLoan = bank - wcLoan;
  const promoterEquity = toCL(s.spvContribution);
  const subsidy = toCL(s.governmentGrant);
  const other = toCL(s.otherSources);
  return {
    promoterEquity,
    subsidy,
    termLoan,
    workingCapitalLoan: wcLoan,
    other,
    debt: bank,
    total: sumCL([promoterEquity, subsidy, termLoan, wcLoan, other]),
  };
}

type Reconciliation = {
  cost: CL;
  financing: CL;
  /** financing − cost. Zero means the plan is fully funded and nothing is left over. */
  difference: CL;
  balanced: boolean;
};

export function reconcileFinancing(data: AnyData | null | undefined): Reconciliation {
  const cost = composeProjectCost(data).total;
  const financing = composeFinancing(data).total;
  return { cost, financing, difference: financing - cost, balanced: financing === cost };
}

/** The bank loan that makes the funding equal the project cost exactly, given the other sources. */
export function balancingBankLoan(data: AnyData | null | undefined): number {
  const cost = composeProjectCost(data).total;
  const f = composeFinancing(data);
  return fromCL(Math.max(0, cost - f.promoterEquity - f.subsidy - f.other));
}
