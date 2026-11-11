import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, expect, test } from 'vitest';

/**
 * Installed-package proof: pack the built package, install the tarball into a
 * throwaway project with npm, and use it the way a consumer does. The
 * assertions are shared with the CI install matrix (Task 4, Step 2b), and the
 * OxLint test runs the exact config snippet the README documents.
 */
const dir = mkdtempSync(join(tmpdir(), 'radan-ui-consumer-'));
const env = {
	...process.env,
	npm_config_cache: join(dir, 'npm-cache'),
	npm_config_audit: 'false',
	npm_config_fund: 'false',
	npm_config_update_notifier: 'false',
};

const run = (command: string, args: string[], cwd = dir) =>
	execFileSync(command, args, { cwd, encoding: 'utf8', env }).trim();

beforeAll(() => {
	// The test packs dist/, so the build must exist and be current even when
	// `pnpm test` runs on its own (the `check` script builds later).
	execFileSync('pnpm', ['build'], { encoding: 'utf8', env });
	const tarball = run('npm', ['pack', process.cwd(), '--pack-destination', dir]).split('\n').pop()!;
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
	run('npm', ['install', '--no-audit', '--no-fund', join(dir, tarball)]);
}, 120_000);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

test('the packed tarball ships docs, README and LICENSE (prepack)', () => {
	const files = run('npm', ['pack', process.cwd(), '--dry-run', '--json'], dir);
	const paths: string[] = JSON.parse(files)[0].files.map((f: { path: string }) => f.path);
	expect(paths).toContain('README.md');
	expect(paths).toContain('LICENSE');
	expect(paths.some((p) => p.startsWith('docs/'))).toBe(true);
});

test('import exposes generateThemeCss', { timeout: 120_000 }, () => {
	writeFileSync(
		join(dir, 'check-import.mjs'),
		"import { generateThemeCss } from '@radandevist/radan-ui';\n" +
			"if (typeof generateThemeCss !== 'function') throw new Error('generateThemeCss missing');\n",
	);
	expect(() => run('node', ['check-import.mjs'])).not.toThrow();
});

test('the installed theme.css carries the prefixed variables', { timeout: 120_000 }, () => {
	const css = readFileSync(join(dir, 'node_modules/@radandevist/radan-ui/dist/theme.css'), 'utf8');
	expect(css).toContain('--radan-ui-primary');
});

test('the installed CLI prints a custom prefix', { timeout: 120_000 }, () => {
	const bin = join(dir, 'node_modules/.bin/radan-ui');
	expect(existsSync(bin)).toBe(true);
	expect(run('node', [bin, 'theme', '--prefix', 't'])).toContain('--t-primary');
});

test(
	'the OxLint config documented in the README loads the house plugin from node_modules',
	{ timeout: 120_000 },
	() => {
		// The exact snippet a consumer pastes: no jsPlugins of their own.
		const readme = readFileSync(join(process.cwd(), '../../README.md'), 'utf8');
		const snippet = readme.slice(readme.indexOf('### Lint')).match(/```json\n([\s\S]*?)```/)?.[1];
		expect(snippet).toBeDefined();
		writeFileSync(join(dir, '.oxlintrc.json'), snippet!);
		mkdirSync(join(dir, 'src'), { recursive: true });
		writeFileSync(join(dir, 'src/bad.ts'), 'export const x = (() => 1)();\n');
		const oxlint = join(process.cwd(), 'node_modules/.bin/oxlint');
		const result = spawnSync(oxlint, ['src/bad.ts'], { cwd: dir, encoding: 'utf8', env });
		expect(result.stderr).not.toContain('Failed');
		expect(result.status).toBe(1);
		expect(result.stdout).toContain('house(no-iife)');
	},
);
