import { OWNER_EXCLUSIVE_TAGS, OWNER_PICK_ONE_GROUPS } from './types.ts';
import type { OwnerTag } from './types.ts';

const isExclusive = (id: string) => (OWNER_EXCLUSIVE_TAGS as string[]).includes(id);

/** Tap on an owner option: stand-alone tags clear the rest, pick-one groups swap, others toggle. */
export function toggleOwner(current: readonly OwnerTag[], id: OwnerTag): OwnerTag[] {
  const has = current.includes(id);
  if (isExclusive(id)) return has ? [] : [id];
  const next = new Set(current.filter((tag) => !isExclusive(tag)));
  if (has) {
    next.delete(id);
    return Array.from(next);
  }
  OWNER_PICK_ONE_GROUPS.filter((group) => group.includes(id)).forEach((group) =>
    group.forEach((tag) => next.delete(tag))
  );
  next.add(id);
  return Array.from(next);
}

/** Make a suggested set of owner tags obey the same rules as tapping them one by one. */
export function sanitizeOwnerTags<T extends string>(ids: readonly T[]): T[] {
  const exclusive = ids.find((id) => isExclusive(id));
  if (exclusive) return [exclusive];
  const out: T[] = [];
  for (const id of ids) {
    if (out.includes(id)) continue;
    const group = OWNER_PICK_ONE_GROUPS.find((g) => (g as string[]).includes(id));
    if (group && out.some((kept) => (group as string[]).includes(kept))) continue;
    out.push(id);
  }
  return out;
}
