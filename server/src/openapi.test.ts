import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';
// @ts-ignore plain JS module
import { buildSpec } from '../scripts/generateOpenApi.mjs';
import SwaggerParser from '@apidevtools/swagger-parser';

describe('OpenAPI documentation', () => {
  it('is a valid OpenAPI 3.0 document', async () => {
    const spec: any = JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'));
    assert.match(spec.openapi, /^3\.0\./);
    await SwaggerParser.validate(structuredClone(spec));
  });
  it('is up to date with the route files (run `npm run docs:openapi` after changing routes)', () => {
    const onDisk = JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'));
    assert.deepEqual(onDisk, JSON.parse(JSON.stringify(buildSpec())));
  });
  it('lists every route in the route files', () => {
    const spec: any = buildSpec();
    const documented = Object.values(spec.paths).reduce((n: number, p: any) => n + Object.keys(p).length, 0);
    let declared = 0;
    for (const file of readdirSync(new URL('./routes/', import.meta.url))) {
      if (!file.endsWith('.routes.ts')) continue;
      declared += (readFileSync(new URL(`./routes/${file}`, import.meta.url), 'utf8').match(/\brouter\.(get|post|put|patch|delete)\(/g) || []).length;
    }
    assert.equal(documented, declared + 1); // + /health, which lives in routes/index.ts
  });
  it('marks sign-in as public and admin routes as secured with their roles', () => {
    const spec: any = buildSpec();
    assert.deepEqual(spec.paths['/auth/login'].post.security, []);
    assert.deepEqual(spec.paths['/admin/users/{id}/deactivate'].post.security, [{ bearerAuth: [] }]);
    assert.match(spec.paths['/admin/users/{id}/deactivate'].post.description, /Admin/);
    assert.ok(spec.paths['/admin/users/{id}/deactivate'].post.responses['403']);
  });
});
