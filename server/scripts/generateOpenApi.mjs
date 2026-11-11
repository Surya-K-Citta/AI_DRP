// Builds openapi.json (OpenAPI 3.0.3) from the Express route files, so the documentation cannot drift from the routes.
// Run: npm run docs:openapi   (the test suite fails if openapi.json is out of date)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const routesDir = path.join(root, 'src/routes');

const TAG_TITLES = {
  auth: 'Auth and accounts', projects: 'Projects', dpr: 'DPR', schemes: 'Schemes', feedback: 'Feedback', admin: 'Admin',
  ai: 'AI assistant', apmsme: 'AP MSME portal', documents: 'Documents', privacy: 'Privacy (DPDP)', reviewer: 'District review', support: 'Support desk',
};
const ROLE_NAMES = { admin: 'APMSMEDC Admin', officer: 'District Reviewer', entrepreneur: 'Entrepreneur' };

function mounts() {
  const index = fs.readFileSync(path.join(routesDir, 'index.ts'), 'utf8');
  const imports = {};
  for (const m of index.matchAll(/import\s+(?:\{\s*(\w+)\s*\}|(\w+))\s+from\s+'\.\/([\w.]+)'/g)) imports[m[1] || m[2]] = m[3];
  const list = [];
  for (const m of index.matchAll(/router\.use\('(\/[\w-]*)',\s*(\w+)\)/g)) if (imports[m[2]]) list.push({ prefix: m[1], file: `${imports[m[2]]}.ts`, tag: m[1].slice(1) });
  return list;
}

function statements(source) {
  // Splits the file into top-level `router.xxx(...)` statements, in order.
  const out = [];
  const re = /\brouter\s*\.\s*(use|get|post|put|patch|delete)\s*\(/g;
  let m;
  while ((m = re.exec(source))) {
    let depth = 1;
    let i = re.lastIndex;
    let quote = null;
    for (; i < source.length && depth > 0; i += 1) {
      const c = source[i];
      if (quote) { if (c === '\\') i += 1; else if (c === quote) quote = null; continue; }
      if (c === "'" || c === '"' || c === '`') quote = c;
      else if (c === '(') depth += 1;
      else if (c === ')') depth -= 1;
    }
    out.push({ method: m[1], text: source.slice(re.lastIndex, i - 1) });
    re.lastIndex = i;
  }
  return out;
}

const rolesIn = (text) => {
  const m = text.match(/authorize\(([^)]*)\)/);
  return m ? [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : null;
};
const humanize = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

export function buildSpec() {
  const paths = {};
  for (const mount of mounts()) {
    const source = fs.readFileSync(path.join(routesDir, mount.file), 'utf8');
    let authenticated = false;
    let fileRoles = null;
    for (const st of statements(source)) {
      if (st.method === 'use') {
        if (/\bauthenticate\b/.test(st.text)) authenticated = true;
        const roles = rolesIn(st.text);
        if (roles) fileRoles = roles;
        continue;
      }
      const routePath = st.text.match(/^\s*['"`]([^'"`]*)['"`]/)?.[1];
      if (routePath === undefined) continue;
      const inlineAuth = /\bauthenticate\b/.test(st.text);
      const roles = rolesIn(st.text) || fileRoles;
      const secured = authenticated || inlineAuth;
      const handler = st.text.match(/(\w+Controller)\.(\w+)\s*(?:\)|,)?\s*$/) || st.text.match(/(\w+Controller)\.(\w+)(?![\s\S]*Controller\.)/);
      const full = (mount.prefix + (routePath === '/' ? '' : routePath)).replace(/:(\w+)/g, '{$1}') || '/';
      const params = [...full.matchAll(/\{(\w+)\}/g)].map((p) => ({ name: p[1], in: 'path', required: true, schema: { type: 'string' } }));
      const summary = handler ? humanize(handler[2]) : `${st.method.toUpperCase()} ${full}`;
      const operation = {
        tags: [TAG_TITLES[mount.tag] || mount.tag],
        summary,
        operationId: `${st.method}${full.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))}`,
        ...(params.length ? { parameters: params } : {}),
        ...(['post', 'put', 'patch'].includes(st.method) ? { requestBody: { required: false, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } } } : {}),
        ...(secured ? { security: [{ bearerAuth: [] }] } : { security: [] }),
        ...(roles ? { description: `Allowed roles: ${roles.map((r) => ROLE_NAMES[r] || r).join(', ')}.` } : {}),
        responses: {
          200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          ...(secured ? { 401: { $ref: '#/components/responses/Unauthorized' } } : {}),
          ...(roles ? { 403: { $ref: '#/components/responses/Forbidden' } } : {}),
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      };
      (paths[full] ||= {})[st.method] = operation;
    }
  }
  paths['/health'] = { get: { tags: ['Service'], summary: 'Health check', operationId: 'getHealth', security: [], responses: { 200: { description: 'The API is running', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' } } } } } } };

  const error = (description) => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/Envelope' } } } });
  const sorted = Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)));
  return {
    openapi: '3.0.3',
    info: {
      title: 'MSME AI DPR API',
      version: '1.0.0',
      description:
        'REST API of the APMSMEDC DPR tool. The API keeps no per-request state in the server: every call carries a short-lived bearer token (15 minutes), and sessions are renewed with the refresh cookie. All answers use the envelope `{ success, message?, data? }`. This file is generated from the route files.',
    },
    servers: [{ url: '/api', description: 'This server' }],
    tags: Object.values(TAG_TITLES).map((name) => ({ name })).concat([{ name: 'Service' }]),
    paths: sorted,
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        Envelope: {
          type: 'object',
          required: ['success'],
          properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { description: 'Endpoint specific', nullable: true } },
          additionalProperties: true,
        },
      },
      responses: {
        BadRequest: error('The request is missing something or has a value that is not accepted'),
        Unauthorized: error('No valid token. Sign in again (also returned for a deactivated account)'),
        Forbidden: error('The signed-in role is not allowed to use this endpoint'),
        TooManyRequests: error('Too many requests from this address; try again later'),
      },
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const spec = buildSpec();
  fs.writeFileSync(path.join(root, 'openapi.json'), JSON.stringify(spec, null, 2) + '\n');
  console.log(`openapi.json written: ${Object.keys(spec.paths).length} paths, ${Object.values(spec.paths).reduce((n, p) => n + Object.keys(p).length, 0)} operations`);
}
