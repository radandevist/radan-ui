/* oxlint-disable anti-slop/no-chained-type-assertions, anti-slop/require-safety-comment-for-type-assertion, anti-slop/no-known-value-widening, anti-slop/no-unknown-parameters -- fakes of Playwright's objects and of the page, which these tests only partly implement */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';

import type { Browser } from 'playwright-core';
import { describe, expect, test } from 'vitest';

import { QaSetupError, runNavStress } from './index';
import { COUNT_CALLS, NO_NAVIGATION_API } from './walk';

/** A browser that drives nothing: `has` = what the page answers to the router / adapter probes. */
const fakeBrowser = (has: { router: boolean; published?: { earlyOffer: string; reason?: string } }) => {
	const page = {
		goto: async () => undefined,
		waitForFunction: async () => {
			if (!has.router) {
				throw new Error('timeout');
			}
		},
		waitForTimeout: async () => undefined,
		goBack: async () => undefined,
		screenshot: async () => undefined,
		evaluate: async (fn: { toString: () => string }) => {
			const source = fn.toString();
			if (source.includes('__radanUiPageTransitions')) {
				return has.published;
			}
			return source.includes('aria-busy') ? [] : undefined;
		},
	};
	const context = {
		addInitScript: async () => undefined,
		newPage: async () => page,
		newCDPSession: async () => ({ send: async () => undefined }),
		route: async () => undefined,
		close: async () => undefined,
	};
	return { newContext: async () => context, close: async () => undefined } as unknown as Browser;
};

const config = (has: Parameters<typeof fakeBrowser>[0], extra = {}) => ({
	baseUrl: 'http://app.test',
	launch: async () => fakeBrowser(has),
	login: async () => undefined,
	delayedRequests: '**/loader',
	routes: ['/', '/a'],
	seeds: [1],
	rounds: 2,
	...extra,
});

describe('runNavStress fails loudly instead of passing for nothing', () => {
	test('no router handle on the page', async () => {
		await expect(runNavStress(config({ router: false }))).rejects.toThrow(QaSetupError);
	});

	test('the adapter reports a broken router contract', async () => {
		await expect(
			runNavStress(config({ router: true, published: { earlyOffer: 'shape-mismatch', reason: '_tx moved' } })),
		).rejects.toThrow(/shape-mismatch: _tx moved/);
	});

	test('nothing to tap', async () => {
		await expect(runNavStress(config({ router: true }, { routes: [] }))).rejects.toThrow(QaSetupError);
	});

	test('a clean run reports the adapter state without failing on no-pending-component', async () => {
		const runs = await runNavStress(config({ router: true, published: { earlyOffer: 'no-pending-component' } }));
		expect(runs).toEqual([{ seed: 1, rounds: 2, stuck: [], earlyOffer: 'no-pending-component' }]);
	});
});

describe('the walk init scripts', () => {
	test('COUNT_CALLS counts each startViewTransition call with the marks on <html> at that moment', () => {
		const dataset: Record<string, string> = { pageDirection: 'push', pageTransition: 'ios' };
		const real: string[] = [];
		const document = {
			documentElement: { dataset },
			startViewTransition(this: unknown, cb: string) {
				real.push(cb);
				return 'vt';
			},
		};
		const window: { __radanUiWalk?: unknown[] } = {};
		runInNewContext(COUNT_CALLS, { window, document });
		expect(document.startViewTransition('a')).toBe('vt');
		delete dataset.pageDirection;
		document.startViewTransition('b');
		expect(real).toEqual(['a', 'b']);
		expect(window.__radanUiWalk).toEqual([
			{ direction: 'push', style: 'ios' },
			{ direction: null, style: 'ios' },
		]);
	});

	test('COUNT_CALLS does nothing where there is no startViewTransition', () => {
		const window: { __radanUiWalk?: unknown[] } = {};
		runInNewContext(COUNT_CALLS, { window, document: {} });
		expect(window.__radanUiWalk).toEqual([]);
	});

	test('NO_NAVIGATION_API removes the API from the instance and the prototype', () => {
		class Window {}
		(Window.prototype as unknown as { navigation: object }).navigation = {};
		const window = new Window() as unknown as { navigation?: object };
		window.navigation = {};
		runInNewContext(NO_NAVIGATION_API, { window, Window });
		expect('navigation' in window).toBe(false);
	});
});

// Node-only by construction (spec §9, §4.2): web code never reaches the qa entry, and the library imports Playwright as types only.
describe('qa stays Node-only', () => {
	const walk = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
		);
	const src = join(import.meta.dirname, '..');
	const sources = walk(src).filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file));

	test('no file outside src/qa imports playwright-core or the qa entry', () => {
		const offenders = sources
			.filter((file) => !file.startsWith(join(src, 'qa')))
			.filter((file) => /playwright-core|\/qa['"]/.test(readFileSync(file, 'utf8')));
		expect(offenders).toEqual([]);
	});

	test('every playwright-core import inside src/qa is `import type`', () => {
		const values = sources
			.filter((file) => file.startsWith(join(src, 'qa')))
			.flatMap((file) =>
				readFileSync(file, 'utf8')
					.split('\n')
					.filter((line) => /from 'playwright-core'/.test(line) && !line.startsWith('import type ')),
			);
		expect(values).toEqual([]);
	});
});
