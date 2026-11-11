#!/usr/bin/env node
// Lists (default) or removes (--apply) the throw-away test accounts that an early audit run wrote into the DEV database
// because RBAC_API_BASE was not pointed at the QA stack. Matches only emails ending in "@msme.test" that were created today or after
// the given --since date, and their own projects / DPR versions. It never touches the audit chain collections.
// Usage: node e2e/cleanup-dev-pollution.mjs [--db mongodb://localhost:27017/msme-dpr] [--since 2026-10-22] [--apply]
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const mongoose = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../server/package.json'))('mongoose');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : fallback; };
const uri = arg('--db', 'mongodb://localhost:27017/msme-dpr');
const since = new Date(arg('--since', new Date().toISOString().slice(0, 10)));
const apply = process.argv.includes('--apply');
if (/qa/.test(uri)) { console.log('That is the QA database; nothing to clean here.'); process.exit(0); }
await mongoose.connect(uri);
const db = mongoose.connection.db;
const users = await db.collection('users').find({ email: /@msme\.test$/i, createdAt: { $gte: since } }, { projection: { email: 1, role: 1, createdAt: 1 } }).toArray();
const ids = users.map((u) => u._id);
const idStrings = ids.map(String);
const count = async (coll, q) => (await db.listCollections({ name: coll }).toArray()).length ? db.collection(coll).countDocuments(q) : 0;
const plan = [
  ['projects', { userId: { $in: [...ids, ...idStrings] } }],
  ['dprversions', { userId: { $in: [...ids, ...idStrings] } }],
  ['users', { _id: { $in: ids } }],
];
console.log(`${apply ? 'APPLY' : 'DRY RUN'} on ${uri} — ${users.length} test accounts created since ${since.toISOString().slice(0, 10)}:`);
users.forEach((u) => console.log('  ', u.email, u.role, u.createdAt?.toISOString?.()));
for (const [coll, q] of plan) console.log(`  ${coll}: ${await count(coll, q)} document(s)`);
if (apply) {
  for (const [coll, q] of plan) { const r = await db.collection(coll).deleteMany(q); console.log(`  deleted ${r.deletedCount} from ${coll}`); }
} else console.log('Nothing was changed. Re-run with --apply to delete exactly the lines above.');
await mongoose.disconnect();
