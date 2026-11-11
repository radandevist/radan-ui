/**
 * Harness test for `house/no-console-in-source`.
 */
import assert from 'node:assert/strict';

import type { Rule } from '@oxlint/plugins';
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import plugin from '../../lint/plugins/house/index.ts';
import { noConsoleInSource } from '../../lint/plugins/house/no-console-in-source.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const RULE_NAME = 'no-console-in-source';

describe('plugin entrypoint wiring (house)', () => {
	it(`wires rules["${RULE_NAME}"] to the rule object`, () => {
		assert.strictEqual(plugin.rules[RULE_NAME], noConsoleInSource);
	});
});

const ruleTester = new RuleTester();

const runCases = (rule: Rule, label: string) => {
	describe(`house/${RULE_NAME} (${label})`, () => {
		ruleTester.run(RULE_NAME, rule, {
			valid: [
				{
					code: "console.log('allowed in scripts');",
					filename: 'scripts/example.ts',
				},
				{
					code: "console.log('allowed in tests');",
					filename: 'src/routes/example/example.test.tsx',
				},
				{
					code: "console.log('allowed in jsx tests');",
					filename: 'src\\routes\\example\\example.test.jsx',
				},
				{
					code: "console.log('not under src - ignored');",
					filename: 'tools/example.ts',
				},
				{
					code: 'const console = mockLogger;\n' + 'export const Example = () => console.log("x");',
					filename: 'src/routes/example/example.ts',
				},
				{
					code: "console.log('windows test file is ignored');",
					filename: 'src\\routes\\example\\example.test.tsx',
				},
			],
			invalid: [
				{
					code: "export const warn = () => console.warn('deprecated');",
					filename: 'src/warn.ts',
					errors: [{ messageId: 'unexpected' }],
				},
				{
					code: 'export const report = () => {\n' + "\tconsole.error('failed');\n" + '};',
					filename: 'src/report.ts',
					errors: [{ messageId: 'unexpected' }],
				},
				{
					code: "console.debug('front should still be checked');",
					filename: 'src/routes/example/example.tsx',
					errors: [{ messageId: 'unexpected' }],
				},
				{
					code: "console.log('front component');",
					filename: 'src/components/auth/page.tsx',
					errors: [{ messageId: 'unexpected' }],
				},
				{
					code: "console.log('front _components');",
					filename: 'src\\_components\\auth\\page.tsx',
					errors: [{ messageId: 'unexpected' }],
				},
			],
		});
	});
};

runCases(noConsoleInSource, 'via direct import');
runCases(plugin.rules[RULE_NAME]!, 'via plugin index export');
