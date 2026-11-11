import { createRequire, Module } from 'node:module';

import { expect, test } from 'vitest';

// metro.cjs is CJS and loads nativewind/metro with require(), which vi.mock cannot intercept:
// seed the require cache with a stub instead (no test hook in the public signature).
const require = createRequire(import.meta.url);
const calls: unknown[][] = [];
const stub = (...args: unknown[]) => (calls.push(args), 'wrapped');
const id = require.resolve('nativewind/metro');
require.cache[id] = { ...new Module(id), id, filename: id, loaded: true, exports: { withNativewind: stub } };
const { withRadanUi } = require('../metro.cjs');

test('withRadanUi wraps withNativewind with the two options the library needs', () => {
	calls.length = 0;
	const config = {};
	expect(withRadanUi(config)).toBe('wrapped');
	expect(calls).toEqual([[config, { inlineVariables: false, inlineRem: 16 }]]);
});

test('withRadanUi lets the app override or extend the options', () => {
	calls.length = 0;
	const config = {};
	withRadanUi(config, { inlineRem: 14, input: './x.css' });
	expect(calls).toEqual([[config, { inlineVariables: false, inlineRem: 14, input: './x.css' }]]);
});
