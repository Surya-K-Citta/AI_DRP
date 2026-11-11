const AGE_KEYS = /^(entrepreneurAge|promoterAge|applicantAge|age)$/i;

function isUnder18Age(value: unknown): boolean {
  if (value == null || value === '') return false;
  const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n >= 0 && n < 18;
}

function scanObject(obj: Record<string, unknown> | null | undefined): boolean {
  if (!obj || typeof obj !== 'object') return false;
  for (const [key, value] of Object.entries(obj)) {
    if (AGE_KEYS.test(key) && isUnder18Age(value)) return true;
  }
  return false;
}

export function hasUnder18Applicant(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (scanObject(data.schemeExtras)) return true;
  if (scanObject(data.step1)) return true;
  return false;
}

export function ageFromDob(iso: string): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}
