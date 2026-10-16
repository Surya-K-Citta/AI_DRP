import crypto from 'crypto';

// AES-256-GCM for personal data stored in database fields.
// Stored form: "enc1:" + base64(iv(12) | tag(16) | ciphertext). Values without the prefix are legacy plaintext and pass through on read.
const PREFIX = 'enc1:';

function toKey(raw: string | undefined): Buffer | null {
  const value = (raw || '').trim();
  if (!value) return null;
  // A 64-character hex string or a 32-byte base64 string is used as the key itself; anything else is stretched with SHA-256.
  if (/^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, 'hex');
  const b64 = Buffer.from(value, 'base64');
  if (b64.length === 32 && b64.toString('base64').replace(/=+$/, '') === value.replace(/=+$/, '')) return b64;
  return crypto.createHash('sha256').update(value).digest();
}

function currentKey(): Buffer | null {
  return toKey(process.env.DATA_ENCRYPTION_KEY);
}

function previousKeys(): Buffer[] {
  return (process.env.DATA_ENCRYPTION_KEY_PREVIOUS || '')
    .split(',')
    .map((k) => toKey(k))
    .filter((k): k is Buffer => !!k);
}

export function isFieldEncryptionEnabled(): boolean {
  return !!currentKey();
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptField(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return value;
  if (isEncrypted(value)) return value;
  const key = currentKey();
  if (!key) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

export function decryptField(value: unknown): unknown {
  if (!isEncrypted(value)) return value;
  const raw = Buffer.from((value as string).slice(PREFIX.length), 'base64');
  if (raw.length < 29) return value;
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ct = raw.subarray(28);
  const keys = [currentKey(), ...previousKeys()].filter((k): k is Buffer => !!k);
  for (const key of keys) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    } catch {
      // try the next key
    }
  }
  // Wrong or missing key: never show ciphertext as if it were data.
  return undefined;
}

export function assertFieldEncryptionConfigured(): void {
  if (process.env.NODE_ENV === 'production' && !currentKey()) {
    throw new Error('DATA_ENCRYPTION_KEY is required in production to encrypt personal data in the database.');
  }
}

// Mongoose plugin: encrypts the listed paths on write and decrypts them on read, including .lean() results.
export function encryptedFieldsPlugin(schema: any, options: { paths: string[]; dates?: string[]; lowercase?: string[] }) {
  const dates = new Set(options.dates || []);
  const lower = new Set(options.lowercase || []);
  for (const path of options.paths) {
    const schemaType = schema.path(path);
    if (!schemaType) continue;
    const isDate = dates.has(path);
    schemaType.set((v: unknown) => {
      if (v === undefined || v === null || v === '') return v;
      let plain: any = v instanceof Date ? v.toISOString() : isEncrypted(v) ? v : String(v).trim();
      if (lower.has(path) && !isEncrypted(plain)) plain = String(plain).toLowerCase();
      return encryptField(plain);
    });
    schemaType.get((v: unknown) => {
      const plain = decryptField(v);
      if (!isDate || typeof plain !== 'string') return plain;
      const d = new Date(plain);
      return Number.isNaN(d.getTime()) ? undefined : d;
    });
  }

  const get = (obj: any, path: string[]) => path.reduce((o, k) => (o == null ? o : o[k]), obj);
  const set = (obj: any, path: string[], value: unknown) => {
    const parent = get(obj, path.slice(0, -1));
    if (parent && typeof parent === 'object') parent[path[path.length - 1]] = value;
  };
  const decryptLean = (doc: any) => {
    if (!doc || typeof doc !== 'object') return;
    for (const p of options.paths) {
      const parts = p.split('.');
      const raw = get(doc, parts);
      if (!isEncrypted(raw)) continue;
      const plain = decryptField(raw);
      set(doc, parts, dates.has(p) && typeof plain === 'string' ? new Date(plain) : plain);
    }
  };
  for (const hook of ['find', 'findOne', 'findOneAndUpdate'] as const) {
    schema.post(hook, function (this: any, result: any) {
      if (!this.mongooseOptions?.().lean) return;
      if (Array.isArray(result)) result.forEach(decryptLean);
      else decryptLean(result);
    });
  }
}
