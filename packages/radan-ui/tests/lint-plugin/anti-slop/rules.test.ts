/**
 * One valid and one invalid case per anti-slop rule, the plugin wiring (every key maps to its own rule object), and the
 * local customizations listed in `lint/plugins/anti-slop/README.md`. `no-known-value-widening` has its own suite.
 */
import assert from 'node:assert/strict';

import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import plugin from '../../../lint/plugins/anti-slop/index.ts';
import { noChainedTypeAssertionsRule } from '../../../lint/plugins/anti-slop/rules/no-chained-type-assertions.ts';
import { noConditionalEmptyObjectSpreadRule } from '../../../lint/plugins/anti-slop/rules/no-conditional-empty-object-spread.ts';
import { noKnownValueWideningRule } from '../../../lint/plugins/anti-slop/rules/no-known-value-widening.ts';
import { noModuleMockingRule } from '../../../lint/plugins/anti-slop/rules/no-module-mocking.ts';
import { noObjectParametersRule } from '../../../lint/plugins/anti-slop/rules/no-object-parameters.ts';
import { noReflectApplyRule } from '../../../lint/plugins/anti-slop/rules/no-reflect-apply.ts';
import { noReflectGetRule } from '../../../lint/plugins/anti-slop/rules/no-reflect-get.ts';
import { noRuntimeTypeofRule } from '../../../lint/plugins/anti-slop/rules/no-runtime-typeof.ts';
import { noForbiddenTermInSymbolNamesRule } from '../../../lint/plugins/anti-slop/rules/no-shape-in-symbol-names.ts';
import { noUnknownParametersRule } from '../../../lint/plugins/anti-slop/rules/no-unknown-parameters.ts';
import { noUnknownReturnsRule } from '../../../lint/plugins/anti-slop/rules/no-unknown-returns.ts';
import { noUnknownTypeAliasesRule } from '../../../lint/plugins/anti-slop/rules/no-unknown-type-aliases.ts';
import { noUnsafeDictionaryTypeRule } from '../../../lint/plugins/anti-slop/rules/no-unsafe-dictionary-type.ts';
import { noWidenThenAssertRule } from '../../../lint/plugins/anti-slop/rules/no-widen-then-assert.ts';
import { requireSafetyCommentForTypeAssertionRule } from '../../../lint/plugins/anti-slop/rules/require-safety-comment-for-type-assertion.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const rules = {
	'no-chained-type-assertions': noChainedTypeAssertionsRule,
	'no-conditional-empty-object-spread': noConditionalEmptyObjectSpreadRule,
	'no-known-value-widening': noKnownValueWideningRule,
	'no-module-mocking': noModuleMockingRule,
	'no-object-parameters': noObjectParametersRule,
	'no-reflect-apply': noReflectApplyRule,
	'no-reflect-get': noReflectGetRule,
	'no-runtime-typeof': noRuntimeTypeofRule,
	'no-shape-in-symbol-names': noForbiddenTermInSymbolNamesRule,
	'no-unknown-parameters': noUnknownParametersRule,
	'no-unknown-returns': noUnknownReturnsRule,
	'no-unknown-type-aliases': noUnknownTypeAliasesRule,
	'no-unsafe-dictionary-type': noUnsafeDictionaryTypeRule,
	'no-widen-then-assert': noWidenThenAssertRule,
	'require-safety-comment-for-type-assertion': requireSafetyCommentForTypeAssertionRule,
};

describe('anti-slop plugin wiring', () => {
	it('exposes exactly the 15 rules, each key mapped to its own rule object', () => {
		assert.deepEqual(Object.keys(plugin.rules).sort(), Object.keys(rules).sort());
		for (const [name, rule] of Object.entries(rules)) {
			assert.strictEqual(plugin.rules[name], rule, name);
		}
	});
});

const ts = (code: string, errors = 1) => ({ code, filename: 'file.ts', errors });
const ok = (code: string) => ({ code, filename: 'file.ts' });

const cases: Record<keyof typeof rules, { valid: ReturnType<typeof ok>[]; invalid: ReturnType<typeof ts>[] }> = {
	'no-chained-type-assertions': {
		valid: [ok('const a = value as string;')],
		invalid: [ts('const a = value as unknown as string;')],
	},
	'no-conditional-empty-object-spread': {
		valid: [ok('const a = { ...base, b };')],
		invalid: [ts('const a = { ...(cond ? { b } : {}) };')],
	},
	'no-known-value-widening': {
		valid: [ok("const a = { x: 1 } as const; const r: Record<'a' | 'b', number> = { a: 1, b: 2 };")],
		invalid: [ts("const a: Record<string, string> = { x: 'y' };")],
	},
	'no-module-mocking': {
		valid: [ok("import { vi } from 'vitest'; vi.fn();")],
		invalid: [ts("import { vi } from 'vitest'; vi.mock('./dep');")],
	},
	'no-object-parameters': {
		valid: [ok('const f = (a: Named) => a;')],
		invalid: [ts('const f = (a: object) => a;')],
	},
	'no-reflect-apply': {
		valid: [ok('f(1);')],
		invalid: [ts('Reflect.apply(f, null, [1]);')],
	},
	'no-reflect-get': {
		valid: [ok('const a = target.key;')],
		invalid: [ts("const a = Reflect.get(target, 'key');")],
	},
	'no-runtime-typeof': {
		valid: [ok('const a = parsed.kind;')],
		invalid: [ts("const a = typeof x === 'string';")],
	},
	'no-shape-in-symbol-names': {
		valid: [ok('const reshape = 1; const owner = 2;')],
		invalid: [ts('const userShape = 1;')],
	},
	'no-unknown-parameters': {
		valid: [ok('const f = (a: string, cause?: unknown) => a;')],
		invalid: [ts('const f = (a: unknown) => a;')],
	},
	'no-unknown-returns': {
		valid: [ok('const f = (): string => "a";')],
		invalid: [ts('const f = (): unknown => 1;')],
	},
	'no-unknown-type-aliases': {
		valid: [ok('type A = string;')],
		invalid: [ts('type A = unknown;')],
	},
	'no-unsafe-dictionary-type': {
		valid: [ok('type A = Record<string, string>;')],
		invalid: [ts('type A = Record<string, unknown>;')],
	},
	'no-widen-then-assert': {
		valid: [ok('const a = { x: 1 }; const b = a as { x: number };')],
		invalid: [ts('const a: unknown = { x: 1 }; const b = a as { x: number };')],
	},
	'require-safety-comment-for-type-assertion': {
		valid: [ok('// SAFETY: checked above\nconst a = value as Named;')],
		invalid: [ts('const a = value as Named;')],
	},
};

const ruleTester = new RuleTester();
for (const [name, set] of Object.entries(cases)) {
	describe(`anti-slop/${name}`, () => {
		// SAFETY: `cases` and `rules` share the same keys.
		ruleTester.run(name, rules[name as keyof typeof rules], set);
	});
}

// Local customizations (see the plugin README): behaviour that differs from the vendored upstream.
describe('anti-slop local customizations', () => {
	ruleTester.run('no-known-value-widening', noKnownValueWideningRule, {
		valid: [
			ok("const r: Record<'a' | 'b', number> = { a: 1, b: 2 };"),
			ok("type Key = 'a' | 'b'; const r: Record<Key, string> = { a: 'x', b: 'y' };"),
		],
		invalid: [
			ts("const r: Record<string, string> = { a: 'x' };"),
			ts("const r: Record<PropertyKey, string> = { a: 'x' };"),
			ts("const r: Record<string | number, string> = { a: 'x' };"),
		],
	});
	ruleTester.run('no-unknown-type-aliases', noUnknownTypeAliasesRule, {
		valid: [ok('type A = Promise<string>;'), ok('type A = string | number;')],
		invalid: [
			ts('type A = string | unknown;'),
			ts('type A = Promise<unknown>;'),
			ts('type A = PromiseLike<unknown>;'),
			ts('type B = unknown; type A = Promise<B>;', 2),
		],
	});
	ruleTester.run('no-module-mocking', noModuleMockingRule, {
		valid: [ok("import * as vi from './other'; vi.mock('x');")],
		invalid: [
			ts("import * as vi from 'vitest'; vi.mock('./dep');"),
			ts("import vi from 'vitest'; vi.doMock('./dep');"),
			ts("import { vi as v } from 'vitest'; v.mock('./dep');"),
		],
	});
	ruleTester.run('no-shape-in-symbol-names', noForbiddenTermInSymbolNamesRule, {
		valid: [ok('const reshape = 1; const Shaper = 2; const shapely = 3;')],
		invalid: [
			ts('const shape = 1;'),
			ts('const SHAPE_KEY = 1;'),
			ts('const isShapeValid = 1;'),
			ts('const shapes = 1;'),
			ts('const my_shape = 1;'),
		],
	});
});
