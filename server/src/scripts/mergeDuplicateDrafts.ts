// @ts-nocheck
// One-off cleanup: the same Latest DPR was listed several times because every "Generate" (and some saves) added a new
// draft record to the project. For each project this keeps the draft that was changed last and removes the older drafts.
// Submitted, approved and rejected DPRs are never touched.
//
// Usage (shows what it would do, changes nothing):  npx ts-node --transpile-only src/scripts/mergeDuplicateDrafts.ts
//       (does it):                                  npx ts-node --transpile-only src/scripts/mergeDuplicateDrafts.ts --apply
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function main() {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI as string);
  const dprs = mongoose.connection.collection('dprversions');
  const projects = mongoose.connection.collection('projects');

  const groups = await dprs
    .aggregate([
      { $match: { status: 'draft' } },
      { $sort: { updatedAt: -1, createdAt: -1 } },
      { $group: { _id: { userId: '$userId', projectId: '$projectId' }, ids: { $push: '$_id' }, names: { $push: '$updatedAt' } } },
      { $match: { 'ids.1': { $exists: true } } },
    ])
    .toArray();

  let remove = 0;
  for (const group of groups) {
    const [keep, ...older] = group.ids;
    const project = mongoose.isValidObjectId(group._id.projectId) ? await projects.findOne({ _id: new mongoose.Types.ObjectId(group._id.projectId) }) : null;
    const individual = project?.projectType === 'individual';
    console.log(`${individual ? 'individual' : 'other     '} project ${group._id.projectId} "${project?.projectName || '?'}": keep ${keep}, remove ${older.length} older draft(s)`);
    if (!individual) continue; // only the Latest (individual) DPR had this problem
    remove += older.length;
    if (apply) await dprs.deleteMany({ _id: { $in: older } });
  }
  console.log(apply ? `Removed ${remove} duplicate draft(s).` : `Dry run: ${remove} duplicate draft(s) would be removed. Run again with --apply to remove them.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
