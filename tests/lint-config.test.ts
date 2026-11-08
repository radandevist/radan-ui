import { spawnSync } from 'node:child_process';

import { expect, test } from 'vitest';

/**
 * Consumer proof: a project whose whole OxLint config is
 * `{ "extends": ["@radandevist/radan-ui/oxlint.json"] }` gets the house
 * plugin, resolved relative to the shared file (proven here against the
 * repo-local path the package will ship).
 */
const lint = (file: string) =>
	spawnSync('pnpm', ['exec', 'oxlint', '-c', 'tests/fixtures/lint/.oxlintrc.json', `tests/fixtures/lint/${file}`], {
		encoding: 'utf8',
	});

test('extends resolves the house plugin path relative to the shared config', () => {
	const result = lint('bad.tsx');
	expect(result.status).toBe(1);
	expect(result.stdout).toContain('house(no-iife)');
});

test('a clean file passes through the shared config', () => {
	const result = lint('good.tsx');
	// The summary line ("Found 0 warnings and 0 errors.") is printed by some oxlint builds only: no count above 0.
	expect(result.stdout).not.toMatch(/\b[1-9]\d* (errors?|warnings?)\b/);
	expect(result.status).toBe(0);
});
