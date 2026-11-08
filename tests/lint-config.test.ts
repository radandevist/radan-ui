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
	expect(result.stdout).not.toContain('error');
	expect(result.status).toBe(0);
});
