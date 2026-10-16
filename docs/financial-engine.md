# Financial engine, funding rules and submission audit

Code: `client/src/lib/finance/` (pure TypeScript, no UI), shown by `components/individual-dpr/FinanceModel.tsx`, enforced in `pages/IndividualDPRCreation.tsx` and, for the money rules, again on the server (`server/src/lib/financeGuard.ts`).

## What each requirement maps to

| # | Requirement | Where | How it is exact |
|---|---|---|---|
| 1 | Project cost = CapEx + OpEx + pre-operative + working capital | `capital.ts` `composeProjectCost` | Every input is rounded to 0.01 lakh first and held as a whole number of hundredths (`money.ts`). Parts are summed as whole numbers, so the total equals the shown parts to two decimals. 300 random drafts are checked |
| 2 | Means of finance = project cost | `capital.ts` `composeFinancing`, `reconcileFinancing` | Promoter equity, subsidy, term loan, working capital loan, other. Difference is a whole number and must be exactly 0. `balancingBankLoan` gives the loan that makes it 0 |
| 3 | 5 to 7 year P&L | `model.ts` `buildModel` | Revenue, variable costs, gross margin, fixed costs, EBITDA, depreciation (written-down value), set-up costs written off, interest (monthly schedule rolled up), tax, PAT. Every line is a whole number of hundredths; subtotals are sums of lines |
| 4 | Cash flow statement | `model.ts` | Operating, investing, financing, opening and closing cash. Each year opens with the previous closing cash (checked); negative cash is flagged |
| 5 | Balance sheet | `model.ts` | Assets = liabilities + equity in every year, as whole numbers. Checked on 300 random drafts and again in every review |
| 6 | IRR, NPV, payback, break-even | `valuation.ts`, `model.ts` | Excel definitions (NPV discounts the first value one period, XIRR uses actual/365). Checked against the Excel help examples (NPV 1,922.06 and 1,188.44, XIRR 37.34%) and against an independent bisection solver on 200 random projects. Not run inside Excel itself |
| 7 | DSCR | `model.ts` | (PAT + depreciation + write-offs + interest) ÷ (principal + interest) per year and on average. Under 1.50 is a warning, not a block |
| 8 | Locked formula catalog | `catalog.ts`, `formulaLock.json` | 19 formulas, each with a version, a plain statement and a worked example run through the real code. SHA-256 of (id, version, statement, example result) is stored in the lock. Any change of behaviour changes the hash and the test fails until the version is raised and `npm run lock:formulas` is run on purpose. Shown on screen as "checked against the locked catalog" |
| 9 | Pre-submission audit | `individualDpr/submissionAudit.ts` | Every required field on every step of the chosen scheme plus the money blockers. Each names its step and field and "Go to answer" scrolls to it. Generate is blocked. An admin with Dev mode on can bypass it in the browser; the server also lets admins through for testing |
| 10 | Cross-section reconciliation | `rules.ts` | Bank loan against the scheme's lending limit (Mudra category, Vishwakarma and SVANidhi tranche, Stand-Up India ₹10 lakh to ₹1 crore, ECLGS 20% of peak working capital); term loan and working capital loan against what they fund |
| 11 | Debt-equity and promoter equity | `rules.ts` | Equity minimum from the scheme docs (PMEGP 10% or 5% special category, PMEGP 2nd loan 10%, PMFME 10%, Stand-Up 10%; other loan schemes default to 10%). Debt-equity = bank debt ÷ (promoter equity + capital subsidy), ceiling 3 to 1 (Stand-Up 9 to 1 because its margin is 10%). Mudra, SVANidhi, Vishwakarma and ECLGS are micro-credit and have neither. Both checks apply only when there is a bank loan |

Grant caps are blocked too: PMFME 35% of cost and ₹10 lakh, SCLCSS 25% of machinery and ₹25 lakh, AP EDP and tech upgrade 75% of fixed capital.

## Assumptions behind the projection (editable under the statements)

Five to seven years (from the loan period), sales growth 5% and cost increase 5% a year, income tax 25% with no loss carry-forward, discount rate 12%, depreciation on written-down value (building and utilities 10%, machinery 15%, furniture 10%; land and deposits none), set-up costs written off over 5 years, working capital grows with sales, term loan with interest-only moratorium then equal monthly instalments, working capital loan stays outstanding. Terminal value for the IRR is the book value still on the balance sheet. Subsidy is a capital reserve.

Sales and costs come from step 14 (sales: Annual Sales Realization; variable: raw material and power; fixed: wages, maintenance, administration, marketing). `initialOpex` (step 12) is supported by the engine but has no field on the form yet. The bank loan field holds term loan and working capital loan together; `workingCapitalLoan` in step 13 splits out the working capital part when set.

## Changing a formula

1. Change the code and bump that formula's `version` in `catalog.ts`.
2. `npm run lock:formulas` (client) rewrites `formulaLock.json`.
3. If a funding rule changed, `npm run vectors` (client) rewrites `server/src/financeGuard.vectors.json`, and update `financeGuard.ts` until `npm test` in the server passes. That test runs the same 25 scenarios on both sides.

## Tests

`client`: `npm test` (finance engine, Excel parity, catalog lock, rules, audit). `server`: `npm test` (client/server parity) and `npm run test:finance` (API running: 422 on generate and submit).
