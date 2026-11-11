/** Hints for the unit written in a label, so nobody has to ask what "₹ Lakhs" or "%" means. */
type UnitHint = { when: RegExp; hint: string };

export const UNIT_HINTS: UnitHint[] = [
  { when: /₹\s*Lakhs?|\(Lakhs?\)/i, hint: 'Amount in lakhs. 1 lakh is ₹1,00,000, so type 2.5 for ₹2,50,000 and 0.5 for ₹50,000.' },
  { when: /\(₹\)|\(₹\s*per|\(₹ \/|₹ \/ /i, hint: 'Amount in rupees. Type the full number, for example 1500.' },
  { when: /\(%\)|%\)|\bpercent|capacity %/i, hint: 'Type a number from 0 to 100, without the % sign.' },
  { when: /sq\.?\s?ft/i, hint: 'Area in square feet. A 10 × 12 ft room is 120 sq.ft.' },
  { when: /\(years?\)|\byears\b.*\(.*\)/i, hint: 'Number of years. Type 0 if less than one year.' },
  { when: /kWh/i, hint: 'Units of electricity used in a month. You can read this on your power bill.' },
  { when: /\(nos\.?\)|\(count\)|\bcount\)/i, hint: 'A whole number, such as 5.' },
  { when: /\(optional\)/i, hint: 'You can leave this blank.' },
];
