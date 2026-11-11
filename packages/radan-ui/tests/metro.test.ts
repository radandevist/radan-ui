import { createRequire } from 'node:module';

import { expect, test } from 'vitest';

const { withRadanUi } = createRequire(import.meta.url)('../metro.cjs');

test('withRadanUi wraps withNativewind with the two options the library needs', () => {
	const calls: unknown[][] = [];
	const config = {};
	const out = withRadanUi(config, (...args: unknown[]) => (calls.push(args), 'wrapped'));
	expect(out).toBe('wrapped');
	expect(calls).toEqual([[config, { inlineVariables: false, inlineRem: 16 }]]);
});
