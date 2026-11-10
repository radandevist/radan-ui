import { execFileSync } from 'node:child_process';

import { expect, test } from 'vitest';

const run = (...args: string[]) =>
	execFileSync('node', ['--import', 'tsx', 'src/cli.ts', ...args], { encoding: 'utf8' });

test('theme prints the CSS with the chosen prefix', () => {
	expect(run('theme', '--prefix', 'acme')).toContain('--acme-primary:');
});

test('theme without --prefix uses radan-ui', () => {
	expect(run('theme')).toContain('--radan-ui-primary:');
});

test('an unknown command exits non-zero with the usage', () => {
	expect(() => run('nope')).toThrow(/usage: radan-ui theme/);
});
