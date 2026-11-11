import { seed } from '../../e2e/seed-qa.mjs';

/** Makes sure the QA stack is up and its four test accounts exist (the seed refuses any database whose name lacks "qa"). */
export default async function globalSetup() {
  const api = process.env.E2E_API_URL || 'http://localhost:5055/api';
  const web = process.env.E2E_BASE_URL || 'http://localhost:5199';
  for (const url of [`${api}/health`, web]) {
    let ok = false;
    try {
      ok = (await fetch(url, { signal: AbortSignal.timeout(4000) })).ok;
    } catch {
      /* reported below */
    }
    if (!ok) throw new Error(`The QA stack is not running (${url}). Start it with: cd e2e && npm run stack:up`);
  }
  await seed();
}
