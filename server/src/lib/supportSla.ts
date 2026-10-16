// Support tiers and response targets. Pure functions so the rules can be tested without a database.
export const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export type Priority = (typeof PRIORITIES)[number];
export type Tier = 'L1' | 'L2' | 'L3';

const HOUR = 3_600_000;
// First-response targets. P1 under 4 hours and P2 under 8 hours are the contractual ones.
export const RESPONSE_TARGET_MS: Record<Priority, number> = { P1: 4 * HOUR, P2: 8 * HOUR, P3: 24 * HOUR, P4: 72 * HOUR };
export const RESOLUTION_TARGET_MS: Record<Priority, number> = { P1: 24 * HOUR, P2: 72 * HOUR, P3: 7 * 24 * HOUR, P4: 14 * 24 * HOUR };

export const PRIORITY_MEANING: Record<Priority, string> = {
  P1: 'Service down, data loss or security incident',
  P2: 'Major feature broken for many users, no workaround',
  P3: 'A feature is broken but there is a workaround',
  P4: 'Question or small improvement',
};

export function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

export function responseDueAt(priority: Priority, createdAt: Date): Date {
  return new Date(createdAt.getTime() + RESPONSE_TARGET_MS[priority]);
}
export function resolutionDueAt(priority: Priority, createdAt: Date): Date {
  return new Date(createdAt.getTime() + RESOLUTION_TARGET_MS[priority]);
}

// Escalation matrix for a ticket that has not had a first response yet:
//  - at 50% of the response target it moves from L1 to L2,
//  - at 100% it moves to L3 and is flagged as a breach.
// P1 starts at L2, because an outage should not wait in the first queue.
export function startingTier(priority: Priority): Tier {
  return priority === 'P1' ? 'L2' : 'L1';
}

export function escalationFor(input: { priority: Priority; tier: Tier; createdAt: Date; firstResponseAt?: Date | null; now: Date }): { tier: Tier; breached: boolean; reason?: string } {
  const { priority, tier, createdAt, firstResponseAt, now } = input;
  if (firstResponseAt) return { tier, breached: false };
  const elapsed = now.getTime() - createdAt.getTime();
  const target = RESPONSE_TARGET_MS[priority];
  if (elapsed >= target) return { tier: 'L3', breached: true, reason: `No first response within ${Math.round(target / HOUR)}h` };
  if (elapsed >= target / 2 && tier === 'L1') return { tier: 'L2', breached: false, reason: 'Half of the response time used with no reply' };
  return { tier, breached: false };
}
