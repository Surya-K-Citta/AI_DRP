// @ts-nocheck
// One-off: encrypts personal data already stored in plaintext. Safe to run again (encrypted values are re-sealed with the current key).
// Usage: DATA_ENCRYPTION_KEY=... npx ts-node --transpile-only src/scripts/encryptExisting.ts
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { decryptField, encryptField, isEncrypted, isFieldEncryptionEnabled } from '../lib/fieldCrypto';

dotenv.config();

async function main() {
  if (!isFieldEncryptionEnabled()) {
    console.error('DATA_ENCRYPTION_KEY is not set. Nothing was changed.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI as string);
  const users = mongoose.connection.collection('users');
  let changed = 0;
  for await (const doc of users.find({})) {
    const $set: Record<string, unknown> = {};
    const take = (path: string, value: unknown) => {
      if (value === undefined || value === null || value === '') return;
      // Already-encrypted values are decrypted and sealed again with the current key, so this also completes a key rotation.
      const plain = isEncrypted(value) ? decryptField(value) : value instanceof Date ? value.toISOString() : String(value);
      if (plain === undefined) return console.warn(`Skipped ${doc._id} ${path}: cannot be decrypted with the keys provided.`);
      $set[path] = encryptField(plain);
    };
    take('phoneNumber', doc.phoneNumber);
    take('dateOfBirth', doc.dateOfBirth);
    take('privacy.nominee.phone', doc.privacy?.nominee?.phone);
    take('privacy.nominee.email', doc.privacy?.nominee?.email);
    if (Object.keys($set).length) {
      await users.updateOne({ _id: doc._id }, { $set });
      changed += 1;
    }
  }
  console.log(`Encrypted personal data on ${changed} account(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
