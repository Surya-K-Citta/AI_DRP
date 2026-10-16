/**
 * Lets the rest of the app ask the open draft page to save before something that would lose its changes
 * (signing out). The page registers a function; nothing is registered when no draft is open.
 */
export type FlushResult = { dirty: boolean; ok: boolean };
type Flusher = () => Promise<FlushResult>;

let flusher: Flusher | null = null;

export function registerDraftFlusher(fn: Flusher): () => void {
  flusher = fn;
  return () => {
    if (flusher === fn) flusher = null;
  };
}

export async function flushPendingDraft(): Promise<FlushResult> {
  if (!flusher) return { dirty: false, ok: true };
  try {
    return await flusher();
  } catch {
    return { dirty: true, ok: false };
  }
}
