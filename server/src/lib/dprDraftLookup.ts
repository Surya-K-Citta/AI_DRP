import mongoose from 'mongoose';
import { DPRVersion } from '../models/DPRVersion.model';

/**
 * The draft DPR a save or a generate should write to: the one the person has open (its id comes with their answers), and
 * otherwise the most recently changed draft of the project. Saving and generating again for the same DPR must update it,
 * never add another one, or the person ends up with the same DPR listed several times.
 */
export async function findEditableDraft(projectId: string, userId: string, requestedDprId?: unknown): Promise<any | null> {
  const id = typeof requestedDprId === 'string' ? requestedDprId : requestedDprId ? String(requestedDprId) : '';
  if (id && mongoose.isValidObjectId(id)) {
    const asked: any = await DPRVersion.findOne({ _id: id, projectId, userId, status: 'draft' });
    if (asked) return asked;
  }
  return DPRVersion.findOne({ projectId, userId, status: 'draft' }).sort({ updatedAt: -1, createdAt: -1 });
}
