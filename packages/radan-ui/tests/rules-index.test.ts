import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

// Apps link only docs/rules/README.md: a rule file missing from it would never reach them.
const dir = join(import.meta.dirname, '../../../docs/rules');

test('the rules index lists every rule file', () => {
	const index = readFileSync(join(dir, 'README.md'), 'utf8');
	const rules = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
	expect(rules.length).toBeGreaterThan(0);
	expect(rules.filter((f) => !index.includes(`(./${f})`))).toEqual([]);
});
