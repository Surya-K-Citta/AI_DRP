import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, beforeEach, describe, it } from 'node:test';
import { decryptField, encryptField, isEncrypted } from './lib/fieldCrypto.ts';
import { integrationStatus, readThrough, registerIntegration, resetIntegrationsForTests, setCacheStore } from './lib/integrations/readThrough.ts';
import { RESPONSE_TARGET_MS, escalationFor, startingTier } from './lib/supportSla.ts';
import { databaseTransportWarning, requireHttps } from './lib/transportSecurity.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);

describe('field encryption (AES-256-GCM)', () => {
  beforeEach(() => {
    process.env.DATA_ENCRYPTION_KEY = KEY_A;
    delete process.env.DATA_ENCRYPTION_KEY_PREVIOUS;
  });
  it('round-trips, never shows the plain value, and uses a fresh IV each time', () => {
    const one = encryptField('9876543210') as string;
    const two = encryptField('9876543210') as string;
    assert.ok(isEncrypted(one));
    assert.ok(!one.includes('9876543210'));
    assert.notEqual(one, two);
    assert.equal(decryptField(one), '9876543210');
  });
  it('passes legacy plaintext and empty values through', () => {
    assert.equal(decryptField('9876543210'), '9876543210');
    assert.equal(encryptField(''), '');
    assert.equal(encryptField(undefined), undefined);
  });
  it('detects tampering and a wrong key instead of returning garbage', () => {
    const sealed = encryptField('secret') as string;
    const flipped = sealed.slice(0, -3) + (sealed.endsWith('AAA') ? 'BBB' : 'AAA');
    assert.equal(decryptField(flipped), undefined);
    process.env.DATA_ENCRYPTION_KEY = KEY_B;
    assert.equal(decryptField(sealed), undefined);
  });
  it('still reads old data after a key rotation while the old key is listed', () => {
    const sealed = encryptField('secret') as string;
    process.env.DATA_ENCRYPTION_KEY = KEY_B;
    process.env.DATA_ENCRYPTION_KEY_PREVIOUS = KEY_A;
    assert.equal(decryptField(sealed), 'secret');
  });
  it('stores plaintext only when no key is configured (development)', () => {
    delete process.env.DATA_ENCRYPTION_KEY;
    assert.equal(encryptField('x'), 'x');
  });
});

describe('transport security', () => {
  const run = (headers: Record<string, string>, method = 'GET') => {
    const out: any = { next: false };
    const res: any = { redirect: (code: number, to: string) => Object.assign(out, { code, to }), status: (c: number) => ({ json: () => Object.assign(out, { code: c }) }) };
    requireHttps({ headers: { host: 'dpr.example', ...headers }, method, path: '/api/x', originalUrl: '/api/x', socket: {} } as any, res, () => (out.next = true));
    return out;
  };
  it('redirects plain HTTP in production, refuses unsafe methods, allows HTTPS', () => {
    process.env.NODE_ENV = 'production';
    assert.deepEqual(run({}), { next: false, code: 308, to: 'https://dpr.example/api/x' });
    assert.equal(run({}, 'POST').code, 426);
    assert.equal(run({ 'x-forwarded-proto': 'https' }).next, true);
    process.env.NODE_ENV = 'test';
    assert.equal(run({}).next, true);
  });
  it('warns about a database link without TLS', () => {
    process.env.NODE_ENV = 'production';
    assert.ok(databaseTransportWarning('mongodb://db.internal:27017/x'));
    assert.equal(databaseTransportWarning('mongodb://db.internal:27017/x?tls=true'), null);
    assert.equal(databaseTransportWarning('mongodb+srv://u:p@cluster.mongodb.net/x'), null);
    process.env.NODE_ENV = 'test';
  });
});

describe('read-first integration framework', () => {
  let server: http.Server;
  let hits = 0;
  let mode: 'ok' | 'down' | 'bad' = 'ok';
  let baseUrl = '';
  const mem = new Map<string, any>();

  before(async () => {
    server = http.createServer((req, res) => {
      hits += 1;
      if (mode === 'down') return res.destroy();
      if (mode === 'bad') { res.statusCode = 500; return res.end('{}'); }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ schemes: [{ schemeCode: 'LIVE' }] }));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as any).port}`;
  });
  after(() => { server.close(); setCacheStore(null); });
  beforeEach(() => {
    hits = 0; mode = 'ok'; mem.clear();
    resetIntegrationsForTests();
    setCacheStore({
      get: async (k) => mem.get(k) || null,
      set: async (k, _i, value, fetchedAt) => { mem.set(k, { value, fetchedAt }); },
    });
  });
  const pick = (b: any) => (Array.isArray(b?.schemes) ? b.schemes : undefined);
  const sample = () => [{ schemeCode: 'SAMPLE' }];

  it('calls the registry once, then answers from the cache while it is fresh', async () => {
    registerIntegration({ name: 'r', baseUrl, ttlMs: 60_000 });
    const a = await readThrough('r', '/schemes', { pick });
    const b = await readThrough('r', '/schemes', { pick });
    assert.equal(a.source, 'live');
    assert.equal(b.source, 'cache');
    assert.equal(b.stale, false);
    assert.equal(hits, 1);
  });
  it('serves the last good answer, marked stale, when the registry is down', async () => {
    registerIntegration({ name: 'r', baseUrl, ttlMs: 1000 });
    let t = Date.now();
    await readThrough('r', '/schemes', { pick, now: () => t });
    mode = 'down';
    t += 5000; // cache is now past its freshness window
    const r = await readThrough('r', '/schemes', { pick, now: () => t, fallback: sample });
    assert.equal(r.source, 'cache');
    assert.equal(r.stale, true);
    assert.deepEqual(r.data, [{ schemeCode: 'LIVE' }]);
  });
  it('uses built-in sample data only when there is nothing cached, and throws without one', async () => {
    registerIntegration({ name: 'r', baseUrl, ttlMs: 1000 });
    mode = 'down';
    const r = await readThrough('r', '/schemes', { pick, fallback: sample });
    assert.equal(r.source, 'fallback');
    await assert.rejects(readThrough('r', '/other', { pick }), (e: any) => e.code === 'INTEGRATION_UNAVAILABLE');
  });
  it('limits upstream calls per minute and degrades instead of failing', async () => {
    registerIntegration({ name: 'r', baseUrl, ttlMs: 0, ratePerMinute: 2 });
    let t = Date.now();
    const sources: string[] = [];
    for (let i = 0; i < 5; i += 1) sources.push((await readThrough('r', '/schemes', { pick, now: () => (t += 10) })).source);
    assert.equal(hits, 2);
    assert.deepEqual(sources, ['live', 'live', 'cache', 'cache', 'cache']);
    assert.equal(integrationStatus()[0].calls.limited, 3);
  });
  it('opens a circuit breaker after repeated failures and stops hitting the registry', async () => {
    registerIntegration({ name: 'r', baseUrl, ttlMs: 0, failureThreshold: 2, cooldownMs: 60_000 });
    mode = 'bad';
    let t = Date.now();
    for (let i = 0; i < 5; i += 1) await readThrough('r', '/schemes', { pick, fallback: sample, now: () => (t += 10) });
    assert.equal(hits, 2);
    assert.equal(integrationStatus()[0].breaker, 'open');
    mode = 'ok';
    t += 61_000;
    assert.equal((await readThrough('r', '/schemes', { pick, fallback: sample, now: () => t })).source, 'live');
  });
  it('falls back cleanly when no registry address is configured', async () => {
    registerIntegration({ name: 'r', baseUrl: '' });
    assert.equal((await readThrough('r', '/schemes', { pick, fallback: sample })).source, 'fallback');
  });
});

describe('support response targets and escalation matrix', () => {
  const created = new Date('2026-01-01T00:00:00Z');
  const at = (hours: number) => new Date(created.getTime() + hours * 3_600_000);
  it('has the contracted P1 (under 4h) and P2 (under 8h) targets', () => {
    assert.equal(RESPONSE_TARGET_MS.P1, 4 * 3_600_000);
    assert.equal(RESPONSE_TARGET_MS.P2, 8 * 3_600_000);
  });
  it('starts a P1 at L2 and everything else at L1', () => {
    assert.equal(startingTier('P1'), 'L2');
    assert.equal(startingTier('P2'), 'L1');
  });
  it('escalates an unanswered P2 to L2 at half time and L3 with a breach at 8h', () => {
    assert.deepEqual(escalationFor({ priority: 'P2', tier: 'L1', createdAt: created, now: at(3) }), { tier: 'L1', breached: false });
    assert.equal(escalationFor({ priority: 'P2', tier: 'L1', createdAt: created, now: at(4) }).tier, 'L2');
    const late = escalationFor({ priority: 'P2', tier: 'L2', createdAt: created, now: at(8) });
    assert.equal(late.tier, 'L3');
    assert.equal(late.breached, true);
  });
  it('does nothing once someone has replied', () => {
    assert.deepEqual(escalationFor({ priority: 'P1', tier: 'L2', createdAt: created, firstResponseAt: at(1), now: at(30) }), { tier: 'L2', breached: false });
  });
});

describe('AI disclaimer on downloads', () => {
  it('is stamped on every page of a PDF, portrait and landscape, without losing pages', async () => {
    const { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } = await import('pdf-lib');
    const { stampAiDisclaimer, AI_DISCLAIMER_TEXT } = await import('./lib/aiDisclaimer.ts');
    const src = await PDFDocument.create();
    src.addPage([595, 842]);
    src.addPage([842, 595]);
    src.addPage([595, 842]);
    const out = await stampAiDisclaimer(Buffer.from(await src.save()));
    const doc = await PDFDocument.load(out);
    assert.equal(doc.getPageCount(), 3);
    for (const page of doc.getPages()) {
      const contents: any = page.node.Contents();
      const streams = contents.asArray ? contents.asArray() : [contents];
      let text = '';
      for (const ref of streams) {
        const stream: any = doc.context.lookup(ref);
        text += Buffer.from(decodePDFRawStream(stream as any).decode()).toString('latin1');
      }
      // pdf-lib writes text as hex strings
      const shown = [...text.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)].map((m) => Buffer.from(m[1], 'hex').toString('latin1')).join('\n');
      assert.ok(shown.includes(AI_DISCLAIMER_TEXT), 'disclaimer missing');
    }
  });
  it('hands back the original bytes when the input is not a PDF', async () => {
    const { stampAiDisclaimer } = await import('./lib/aiDisclaimer.ts');
    const junk = Buffer.from('not a pdf');
    assert.equal(await stampAiDisclaimer(junk), junk);
  });
});

describe('shared state in Redis (tested against an in-memory Redis stand-in, not a real server)', () => {
  it('counts rate-limit hits across servers and resets the window', async () => {
    const RedisMock = (await import('ioredis-mock')).default as any;
    const { setRedisForTests } = await import('./lib/redis.ts');
    const { RedisRateLimitStore } = await import('./lib/redisRateLimitStore.ts');
    const fake = new RedisMock();
    fake.status = 'ready';
    setRedisForTests(fake);
    const a = new RedisRateLimitStore('t:');
    const b = new RedisRateLimitStore('t:'); // a second API server
    a.init({ windowMs: 60_000 });
    b.init({ windowMs: 60_000 });
    assert.equal((await a.increment('1.2.3.4')).totalHits, 1);
    assert.equal((await b.increment('1.2.3.4')).totalHits, 2);
    const third = await a.increment('1.2.3.4');
    assert.equal(third.totalHits, 3);
    assert.ok(third.resetTime.getTime() > Date.now());
    assert.ok((await fake.pttl('t:1.2.3.4')) > 0, 'the counter must expire');
    await b.decrement('1.2.3.4');
    assert.equal((await a.increment('1.2.3.4')).totalHits, 3);
    await a.resetKey('1.2.3.4');
    assert.equal((await b.increment('1.2.3.4')).totalHits, 1);
    setRedisForTests(null);
  });
  it('falls back to memory counting when Redis is not available', async () => {
    const { setRedisForTests } = await import('./lib/redis.ts');
    const { RedisRateLimitStore } = await import('./lib/redisRateLimitStore.ts');
    setRedisForTests(null);
    const store = new RedisRateLimitStore();
    store.init({ windowMs: 60_000 });
    assert.equal((await store.increment('x')).totalHits, 1);
    assert.equal((await store.increment('x')).totalHits, 2);
  });
});
