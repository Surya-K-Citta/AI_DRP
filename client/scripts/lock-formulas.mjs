// Regenerates src/lib/finance/formulaLock.json from the formula catalog.
// Run this ONLY after deliberately changing a formula, and raise that formula's version in catalog.ts first.
import { writeFileSync } from 'node:fs';
import { computeLock } from '../src/lib/finance/catalog.ts';

const lock = await computeLock();
writeFileSync(new URL('../src/lib/finance/formulaLock.json', import.meta.url), JSON.stringify(lock, null, 2) + '\n');
console.log(`locked ${Object.keys(lock.formulas).length} formulas, catalog ${lock.catalogVersion}, sha256 ${lock.catalogSha256.slice(0, 16)}…`);
