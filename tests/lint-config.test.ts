import { spawnSync } from 'node:child_process';

import { expect, test } from 'vitest';

/**
 * Shared-config proof inside the repo: a project extending `lint/oxlint.json`
 * gets the house plugin, resolved relative to that file. The installed-package
 * case (the snippet the README documents, loaded from `node_modules`) is
 * covered by `tests/package.test.ts`.
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
