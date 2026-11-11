// Creates the QA accounts in the QA database (never the dev one). Safe to run repeatedly.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '../server/package.json'));
const mongoose = require('mongoose');
export const QA = {
  api: process.env.QA_API || 'http://localhost:5055/api',
  web: process.env.QA_WEB || 'http://localhost:5199',
  mongo: process.env.QA_MONGODB_URI || 'mongodb://localhost:27017/msme-dpr-qa',
  password: 'Qa-Test-2026!',
  users: {
    consultant: { email: 'qa.consultant@msme.test', name: 'QA Consultant', role: 'entrepreneur' },
    consultant2: { email: 'qa.consultant2@msme.test', name: 'QA Second Consultant', role: 'entrepreneur' },
    admin: { email: 'qa.admin@msme.test', name: 'QA Admin', role: 'admin' },
    officer: { email: 'qa.officer@msme.test', name: 'QA Officer', role: 'officer', reviewDistrict: 'Guntur' },
  },
};
if (!/qa/.test(QA.mongo)) throw new Error('Refusing to seed a database whose name does not contain "qa"');

async function api(method, path, body, token) {
  const r = await fetch(QA.api + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await r.json(); } catch {}
  return { status: r.status, body: json };
}

export async function seed() {
  await mongoose.connect(QA.mongo);
  const users = mongoose.connection.db.collection('users');
  for (const u of Object.values(QA.users)) {
    const exists = await users.findOne({ email: u.email });
    if (!exists) {
      const res = await api('POST', '/auth/register', { name: u.name, email: u.email, password: QA.password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
      if (res.status !== 201) throw new Error(`register ${u.email}: ${res.status} ${JSON.stringify(res.body)}`);
    }
    await users.updateOne({ email: u.email }, { $set: { role: u.role, isActive: true, ...(u.reviewDistrict ? { reviewDistrict: u.reviewDistrict } : {}) } });
  }
  await mongoose.disconnect();
}
if (process.argv[1] && process.argv[1].endsWith('seed-qa.mjs')) { await seed(); console.log('QA accounts ready:', Object.values(QA.users).map((u) => u.email).join(', ')); }
