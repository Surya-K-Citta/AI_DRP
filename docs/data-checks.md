# Automated data checks

Advisory prompts on the Create DPR form for answers that are **missing**, **unclear**, **do not add up**, or look **unusual**. They never block on their own (the existing required-field checks still do). Engine: `client/src/lib/individualDpr/dataChecks.ts` (pure, unit tested). Screens: `components/individual-dpr/DataChecks.tsx`, wired in `pages/IndividualDPRCreation.tsx`.

## Where they show

- **On the step being filled:** an amber "Please check these answers" box above the form. It stays quiet until the step has some answers, so nobody is told off for a step they have not opened yet.
- **Whole form:** the **Check my answers** button in the header (with a count) opens a list grouped as Missing, Does not add up, Unclear, Unusual. Each item has **Go to answer** and **This is correct**.
- **Before generating:** **Generate DPR** opens the same list if anything is open, with **Generate anyway**. Nothing is blocked by these notes.
- **This is correct** hides a note. It comes back if the answer it was about changes (the dismissal is keyed to the values). Saved in the draft (`schemeExtras.dismissedChecks`).

## Rules

| Kind | Rule |
|---|---|
| Missing | project cost empty; funding empty; yearly sales empty; "what your business does" empty (end of form only) |
| Unclear | placeholder text (na, test, xxx, 123); very short narrative answers; the same narrative copied into two fields; an amount of 5,000+ lakh (probably rupees typed as lakhs) |
| Does not add up | funding total differs from project cost by more than 1% (min 0.05 lakh); grace period not shorter than the loan period; production date before the commitment date |
| Unusual | interest rate under 6% or over 16%; loan period under 12 or over 180 months; own money under 5% of cost; subsidy over 50% of cost; project cost over ₹5 crore; yearly costs above yearly sales; capacity use over 100% or under 30%; break-even over 100%; over 250 direct jobs |

The thresholds are judgement defaults for small units, written in plain words in the message ("usually between 8% and 14%"). They are suggestions, not scheme rules: change them in one place if a scheme needs different limits.

## Adding or changing a rule

Add it in `runDataChecks` with an `id`, a `kind`, the content `step`, an English `message` and `hint` (tokens `{a} {b} {c}` filled from `vars`), then add the Telugu lines to `lib/i18n/te/plainChecksTe.ts`. `npm run audit:i18n` fails if a message or hint has no Telugu line.
