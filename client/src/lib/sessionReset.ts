import { useIndividualDPRStore } from '@/store/individualDPRStore';
import { useClusterDPRStore } from '@/store/clusterDPRStore';
import { useDPRStore } from '@/store/dprStore';
import { useProjectStore } from '@/store/projectStore';
import { useChatStore } from '@/store/chatStore';

/**
 * Forget everything that belongs to the person who just signed out: the draft on screen, cached DPR and
 * project lists, the chat, and cached API answers. Called from `logout`, so every sign-out path is covered.
 */
export function clearUserSession(): void {
  useIndividualDPRStore.getState().resetData();
  useClusterDPRStore.getState().resetData();
  useDPRStore.getState().clearDPRs();
  useProjectStore.setState({ projects: [], currentProject: null, lastFetched: null });
  useChatStore.getState().clearMessages();
  // api.ts imports the auth store, so it is loaded lazily here to avoid a circular import.
  void import('@/lib/api').then(({ api }) => api.resetSession());
}
