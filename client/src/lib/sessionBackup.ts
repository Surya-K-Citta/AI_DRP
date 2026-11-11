import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { hasDraftContent } from '@/lib/individualDpr/draftState';
import { toIndividualPayload } from '@/lib/individualDpr/toIndividualPayload';

const KEY = 'dpr-session-backup';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type Backup = { userId: string; savedAt: number; payload: unknown };

/**
 * When a session ends with changes the server never got, keep a copy on this device so the next
 * sign-in by the same person can put it back.
 */
export function backUpOpenDraft(userId: string | undefined): boolean {
  try {
    if (!userId) return false;
    const data = useIndividualDPRStore.getState().data;
    if (!hasDraftContent(data)) return false;
    const backup: Backup = { userId, savedAt: Date.now(), payload: toIndividualPayload(data) };
    localStorage.setItem(KEY, JSON.stringify(backup));
    return true;
  } catch {
    return false;
  }
}

export function takeBackup(userId: string | undefined): Backup | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || !userId) return null;
    const backup = JSON.parse(raw) as Backup;
    if (backup.userId !== userId) return null;
    if (Date.now() - backup.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return backup;
  } catch {
    return null;
  }
}

export function clearBackup(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
