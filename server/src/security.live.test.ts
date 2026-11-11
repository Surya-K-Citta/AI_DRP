import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import http from 'node:http';
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Needs the API running (npm run dev). Creates throw-away users and DPRs and removes them afterwards.
const base = process.env.RBAC_API_BASE || 'http://localhost:5000/api';
const password = 'Sec-Test-2026';
const stamp = Date.now();
const email = (tag: string) => `sec.${tag}.${stamp}@msme.test`;
const people: Record<string, { token: string; id: string }> = {};
let dprId = '';
let projectId = '';

async function call(method: string, path: string, token?: string, body?: unknown, raw = false) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(raw ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : raw ? (body as any) : JSON.stringify(body),
  });
  const type = response.headers.get('content-type') || '';
  let json: any = null;
  if (type.includes('json')) {
    try { json = await response.json(); } catch { /* empty */ }
  } else {
    json = Buffer.from(await response.arrayBuffer());
  }
  return { status: response.status, body: json, type, headers: response.headers };
}

async function register(tag: string) {
  const result = await call('POST', '/auth/register', undefined, { name: `Sec ${tag}`, email: email(tag), password, phoneNumber: '9876543210', dateOfBirth: '1990-01-01', accountConsent: true, privacyConsent: true });
  assert.equal(result.status, 201);
  return { token: result.body.data.token as string, id: String(result.body.data.userId) };
}

const db = async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI as string);
  return mongoose.connection.db!;
};

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');

function upload(path: string, field: string, name: string, type: string, bytes: Buffer, token: string) {
  const form = new FormData();
  form.append(field, new Blob([bytes], { type }), name);
  return call('POST', path, token, form, true);
}

before(async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200, `API is not running at ${base}`);
  for (const tag of ['a', 'b', 'admin']) people[tag] = await register(tag);
  const database = await db();
  await database.collection('users').updateOne({ email: email('admin') }, { $set: { role: 'admin' } });
  const project = await database.collection('projects').insertOne({
    userId: people.a.id, projectType: 'individual', projectName: `Sec ${stamp}`, industrySector: 'Food', totalCost: 1, ownContribution: 1, loanAmount: 0, location: 'T', stepData: { step1: { district: 'Guntur' } },
  });
  projectId = String(project.insertedId);
  const dpr = await database.collection('dprversions').insertOne({ projectId, userId: people.a.id, status: 'draft', content: { english: {}, telugu: {} } });
  dprId = String(dpr.insertedId);
});

after(async () => {
  const database = await db();
  await database.collection('users').deleteMany({ email: { $regex: `^sec\\..*\\.${stamp}@msme\\.test$` } });
  await database.collection('projects').deleteMany({ projectName: `Sec ${stamp}` });
  await database.collection('dprversions').deleteMany({ projectId });
  await database.collection('kycfiles').deleteMany({ userId: { $in: Object.values(people).map((p) => p.id) } });
  await database.collection('auditevents').deleteMany({ userId: { $in: Object.values(people).map((p) => p.id) } });
  await mongoose.disconnect();
});

describe('injection', () => {
  it('Mongo operators in login and registration bodies are refused', async () => {
    assert.equal((await call('POST', '/auth/login', undefined, { email: { $ne: null }, password: { $ne: null } })).status, 400);
    const wrong = await call('POST', '/auth/login', undefined, { email: email('a'), password: { $ne: 'x' } });
    assert.equal(wrong.status, 400, 'an operator must never be accepted as a password');
  });
  it('operators in query strings do not widen a query or crash the server', async () => {
    const result = await call('GET', '/admin/users?role[$ne]=nobody&search[$regex]=.*', people.admin.token);
    assert.ok(result.status < 500, `status ${result.status}`);
  });
  it('script markup saved in a text field comes back inert', async () => {
    const put = await call('PUT', '/auth/profile', people.a.token, { name: '<img src=x onerror=alert(1)>Ravi <script>steal()</script>', location: '< 5 km & near "town"' });
    assert.equal(put.status, 200);
    const profile = await call('GET', '/auth/profile', people.a.token);
    assert.ok(!/<img|<script|onerror|steal/i.test(profile.body.data.name), profile.body.data.name);
    assert.ok(profile.body.data.name.includes('Ravi'));
    assert.equal(profile.body.data.location, '< 5 km & near "town"');
  });
  it('a path in a file name cannot reach other files', async () => {
    for (const name of ['..%2f..%2f.env', '%2e%2e%2f.env', '..%5c..%5c.env', 'a%00.pdf']) {
      const result = await call('GET', `/documents/file/${name}`, people.a.token);
      assert.ok([400, 404].includes(result.status), `${name} -> ${result.status}`);
      assert.ok(!String(result.body instanceof Buffer ? result.body.toString() : JSON.stringify(result.body)).includes('MONGODB_URI'));
    }
  });
});

describe('uploads', () => {
  it('HTML sent as an image is refused', async () => {
    const result = await upload('/dpr/cluster/images/upload', 'image', 'evil.png', 'image/png', Buffer.from('<html><script>alert(1)</script></html>'), people.a.token);
    assert.equal(result.status, 400);
    assert.equal(result.body.code, 'UPLOAD_REJECTED');
  });
  it('a script, executable or empty file is refused as a document', async () => {
    for (const [name, bytes] of [['x.pdf', Buffer.from('<?php echo 1; ?>\u0000\u0001\u0002')], ['x.docx', Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0])], ['x.pdf', Buffer.alloc(0)]] as const) {
      const result = await upload('/dpr/cluster/documents/upload', 'document', name, 'application/pdf', bytes as Buffer, people.a.token);
      assert.equal(result.status, 400, name);
    }
  });
  it('a real image is accepted and stored under its verified type, not the uploaded name', async () => {
    const result = await upload('/dpr/cluster/images/upload', 'image', '"><script>.html', 'image/png', PNG, people.a.token);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.ok(!/[<>"]/.test(result.body.data.originalName));
    const file = await call('GET', `/dpr/cluster/files/${result.body.data.fileId}`, people.a.token);
    assert.equal(file.status, 200);
    assert.equal(file.type, 'image/png');
    assert.equal(file.headers.get('x-content-type-options'), 'nosniff');
    assert.match(file.headers.get('content-security-policy') || '', /sandbox/);
    assert.ok(!/[\r\n]/.test(file.headers.get('content-disposition') || ''));
    // Someone else cannot read it.
    assert.equal((await call('GET', `/dpr/cluster/files/${result.body.data.fileId}`, people.b.token)).status, 403);
  });
  it('a real PDF is accepted as a document', async () => {
    const result = await upload('/dpr/cluster/documents/upload', 'document', 'quote.pdf', 'application/pdf', Buffer.from('%PDF-1.4\n%test\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'), people.a.token);
    assert.equal(result.status, 200, JSON.stringify(result.body));
  });
});

describe('access to DPRs and exports', () => {
  it("another user cannot read, export, change, submit or delete someone else's DPR", async () => {
    const b = people.b.token;
    for (const [method, path, body] of [
      ['GET', `/dpr/${dprId}`],
      ['GET', `/dpr/${dprId}/download/pdf`],
      ['GET', `/dpr/${dprId}/download/docx`],
      ['GET', `/dpr/${dprId}/download/xls`],
      ['POST', `/dpr/${dprId}/download/pdf/html`, { html: '<p>x</p>' }],
      ['PUT', `/dpr/${dprId}/content`, { section: 'a', content: 'b' }],
      ['POST', `/dpr/${dprId}/submit`, {}],
      ['GET', `/dpr/${dprId}/quality`],
      ['DELETE', `/dpr/${dprId}`],
      ['GET', `/dpr/cluster/${dprId}`],
    ] as const) {
      const result = await call(method, path, b, body);
      assert.equal(result.status, 403, `${method} ${path} -> ${result.status}`);
    }
    assert.equal((await call('GET', `/dpr/${dprId}`, people.a.token)).status, 200);
    assert.equal((await call('GET', '/dpr/not-an-id', people.a.token)).status, 404);
  });
});

describe('PDF export from browser HTML makes no outside requests', () => {
  it('a hostile page reaches neither the network nor the file system', async () => {
    const hits: string[] = [];
    const server = http.createServer((req, res) => { hits.push(req.url || ''); res.end('x'); });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as any).port;
    const target = `http://127.0.0.1:${port}`;
    const html = `<!doctype html><html><head><link rel="stylesheet" href="${target}/css"><style>@import url(${target}/import.css); body{background:url(${target}/bg.png)}</style></head>
      <body><h1>Hostile</h1><img src="${target}/img"><iframe src="${target}/frame"></iframe><iframe src="file:///etc/hosts"></iframe>
      <script>fetch("${target}/script")</script><svg onload="fetch('${target}/svg')"></svg><img src=x onerror="fetch('${target}/onerror')">
      <div style="background:url(${target}/inline)">text</div></body></html>`;
    const result = await call('POST', `/dpr/${dprId}/download/pdf/html`, people.a.token, { html });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    server.close();
    assert.deepEqual(hits, [], `the page contacted: ${hits.join(', ')}`);
    assert.ok(result.status === 200 || result.status === 500, `status ${result.status} (500 only if Chrome is not installed)`);
    if (result.status === 200) assert.equal(result.body.subarray(0, 4).toString(), '%PDF');
  });
});
