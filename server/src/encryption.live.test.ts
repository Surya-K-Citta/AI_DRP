import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });
process.env.DATA_ENCRYPTION_KEY = 'c'.repeat(64);

// Needs MongoDB only (no API). Creates one throw-away user and removes it.
const email = `enc.${Date.now()}@msme.test`;
let id: any;
const raw = async () => (await mongoose.connection.collection('users').findOne({ _id: id })) as any;

describe('personal data is encrypted in the database', () => {
  let User: any;
  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    ({ User } = await import('./models/User.model.ts'));
    const user = await User.create({
      name: 'Enc Test', email, passwordHash: 'Enc-Test-2026', phoneNumber: '9876543210',
      dateOfBirth: new Date('1990-05-17T00:00:00.000Z'),
      privacy: { nominee: { name: 'Nominee', phone: '9123456789', email: 'Nominee@Example.com' } },
    });
    id = user._id;
  });
  after(async () => {
    if (id) await mongoose.connection.collection('users').deleteOne({ _id: id });
    await mongoose.disconnect();
  });

  it('stores phone, date of birth and nominee contact as ciphertext', async () => {
    const stored = await raw();
    for (const value of [stored.phoneNumber, stored.dateOfBirth, stored.privacy.nominee.phone, stored.privacy.nominee.email]) {
      assert.ok(String(value).startsWith('enc1:'), String(value));
    }
    assert.ok(!JSON.stringify(stored).includes('9876543210'));
    assert.ok(!JSON.stringify(stored).includes('9123456789'));
    assert.ok(!JSON.stringify(stored).toLowerCase().includes('nominee@example.com'));
    assert.equal(stored.email, email); // sign-in lookup stays readable
  });

  it('reads back as the original values, including .lean() and selected fields', async () => {
    const doc = await User.findById(id);
    assert.equal(doc.phoneNumber, '9876543210');
    assert.ok(doc.dateOfBirth instanceof Date);
    assert.equal(doc.dateOfBirth.toISOString(), '1990-05-17T00:00:00.000Z');
    assert.equal(doc.privacy.nominee.email, 'nominee@example.com');
    const lean = await User.findById(id).select('name email phoneNumber').lean();
    assert.equal(lean.phoneNumber, '9876543210');
    const list = await User.find({ _id: id }).lean();
    assert.equal(list[0].privacy.nominee.phone, '9123456789');
    assert.equal(list[0].dateOfBirth.toISOString(), '1990-05-17T00:00:00.000Z');
  });

  it('keeps updates encrypted', async () => {
    const updated = await User.findByIdAndUpdate(id, { phoneNumber: '9000000001' }, { new: true });
    assert.equal(updated.phoneNumber, '9000000001');
    assert.ok(String((await raw()).phoneNumber).startsWith('enc1:'));
    const again = await User.findById(id);
    again.phoneNumber = '9000000002';
    await again.save();
    assert.ok(String((await raw()).phoneNumber).startsWith('enc1:'));
    assert.equal((await User.findById(id)).phoneNumber, '9000000002');
  });

  it('still reads accounts saved before encryption was switched on', async () => {
    await mongoose.connection.collection('users').updateOne({ _id: id }, { $set: { phoneNumber: '9111111111', dateOfBirth: new Date('1985-01-02T00:00:00.000Z') } });
    const doc = await User.findById(id);
    assert.equal(doc.phoneNumber, '9111111111');
    assert.equal(new Date(doc.dateOfBirth).getUTCFullYear(), 1985);
    const lean = await User.findById(id).lean();
    assert.equal(lean.phoneNumber, '9111111111');
  });
});
