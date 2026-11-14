import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Environment, Place } from './page-transition.contract';
import {
	appliedStyle,
	beginPageTransition,
	directionOf,
	guardViewTransitions,
	isIOS,
	markBackToParent,
	platformStyle,
	readStyle,
	skipsTraversal,
	transitionFor,
	writeStyle,
} from './page-transition.core';

const at = (path: string, index: number | undefined, overlay = false): Place => ({ path, index, overlay });
const ENV: Environment = { style: 'ios', fromMd: false, reducedMotion: false, supported: true };

describe('directionOf', () => {
	it('has none on a first load (reload, direct link)', () => {
		expect(directionOf(undefined, at('/pickups', 0))).toBeUndefined();
	});
	it('pushes into a detail page and goes back out of it (the system back included: only the index tells)', () => {
		expect(directionOf(at('/pickups', 1), at('/pickups/P-4', 2))).toBe('push');
		expect(directionOf(at('/pickups/P-4', 2), at('/pickups', 1))).toBe('back');
	});
	it('fades between top-level sections, the history Back between two included', () => {
		expect(directionOf(at('/pickups', 1), at('/forwarders', 2))).toBe('fade');
		expect(directionOf(at('/pickups/P-4', 2), at('/forwarders', 3))).toBe('fade');
		expect(directionOf(at('/', 2), at('/pickups', 1), { traversal: true })).toBe('fade');
	});
	it('goes back to the parent with the arrow when there is no earlier entry', () => {
		expect(directionOf(at('/pickups/P-4', 0), at('/pickups', 1), { toParent: true })).toBe('back');
	});
	it('goes back with the arrow fallback even from a top-level page, on a replaced entry', () => {
		expect(directionOf(at('/forwarders/tracking', 1), at('/forwarders', 1), { toParent: true })).toBe('back');
		expect(directionOf(at('/forwarders', 1), at('/', 1), { toParent: true })).toBe('back');
	});
	it('pushes on a forward traversal', () => {
		expect(directionOf(at('/pickups', 1), at('/pickups/P-4', 2), { traversal: true })).toBe('push');
	});
	it('has none for a replace or a change inside one page', () => {
		expect(directionOf(at('/pickups', 1), at('/forwarders', 1))).toBeUndefined();
		expect(directionOf(at('/', 1), at('/', 2))).toBeUndefined();
	});
	it('treats the notification sheet opening as a push and closing as a back', () => {
		expect(directionOf(at('/', 1), at('/', 2, true))).toBe('push');
		expect(directionOf(at('/', 2, true), at('/', 1))).toBe('back');
		expect(directionOf(at('/', 1, true), at('/', 1))).toBe('back');
	});
});

describe('transitionFor', () => {
	it('keeps the direction on a phone with the API', () => {
		expect(transitionFor('push', ENV)).toBe('push');
	});
	it.each([
		['style none', { style: 'none' as const }],
		['from md', { fromMd: true }],
		['reduced motion', { reducedMotion: true }],
		['no View Transitions API', { supported: false }],
	])('has none with %s', (_, patch) => {
		expect(transitionFor('back', { ...ENV, ...patch })).toBeUndefined();
	});
	it('has none without a direction', () => {
		expect(transitionFor(undefined, ENV)).toBeUndefined();
	});
});

describe('platformStyle', () => {
	it('is iPhone on an iPhone', () => {
		expect(
			platformStyle({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari', maxTouchPoints: 5 }),
		).toBe('ios');
	});
	it('is iPhone on an iPad reporting as a touch Mac', () => {
		expect(
			platformStyle({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari', maxTouchPoints: 5 }),
		).toBe('ios');
	});
	it('is Material on Android, by user agent or by userAgentData', () => {
		expect(platformStyle({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126 Mobile' })).toBe('material');
		expect(
			platformStyle({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', userAgentData: { platform: 'Android' } }),
		).toBe('material');
	});
	it('is iPhone on a desktop or when unknown', () => {
		expect(
			platformStyle({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/126', userAgentData: { platform: 'Linux' } }),
		).toBe('ios');
		expect(platformStyle({})).toBe('ios');
	});
	it('applies auto by platform and leaves a chosen style alone', () => {
		expect(appliedStyle('auto', { userAgent: 'Android' })).toBe('material');
		expect(appliedStyle('ios', { userAgent: 'Android' })).toBe('ios');
	});
});

describe('the stored style', () => {
	const memory = () => {
		const data = new Map<string, string>();
		return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
	};
	it('defaults to auto and round-trips a choice', () => {
		const store = memory();
		expect(readStyle(store)).toBe('auto');
		writeStyle('material', store);
		expect(readStyle(store)).toBe('material');
	});
	it('ignores an invalid value and survives a blocked storage', () => {
		const store = memory();
		store.setItem('radan-ui:page-transition', 'wobble');
		expect(readStyle(store)).toBe('auto');
		const blocked = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			},
		};
		expect(readStyle(blocked)).toBe('auto');
		expect(() => writeStyle('none', blocked)).not.toThrow();
	});
});

describe('iOS own traversals', () => {
	const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', maxTouchPoints: 5 };
	const IPAD_DESKTOP = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 };
	it('detects iPhone and iPadOS (Mac user agent with touch), not a Mac or Android', () => {
		expect(isIOS(IPHONE)).toBe(true);
		expect(isIOS(IPAD_DESKTOP)).toBe(true);
		expect(isIOS({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 })).toBe(false);
		expect(isIOS({ userAgent: 'Mozilla/5.0 (Linux; Android 14)' })).toBe(false);
	});
	it('skips a traversal the app did not start, on iOS only', () => {
		expect(skipsTraversal({ traversal: true }, IPHONE)).toBe(true);
		expect(skipsTraversal({ traversal: true, appStarted: true }, IPHONE)).toBe(false);
		expect(skipsTraversal({ traversal: true }, { userAgent: 'Android' })).toBe(false);
		expect(skipsTraversal({}, IPHONE)).toBe(false);
	});
});

describe('guardViewTransitions', () => {
	type Doc = Parameters<typeof guardViewTransitions>[0];
	const fakeDoc = (start: Doc['startViewTransition']) => {
		const dataset: DOMStringMap = { pageTransition: 'ios', pageDirection: 'push' };
		return { documentElement: { dataset }, startViewTransition: start };
	};
	const settled = (finished: Promise<undefined>) => ({ finished, updateCallbackDone: Promise.resolve(undefined) });
	it('removes the attributes when the transition finishes', async () => {
		let finish = () => {};
		const finished = new Promise<undefined>((resolve) => (finish = () => resolve(undefined)));
		const doc = fakeDoc(() => settled(finished));
		guardViewTransitions(doc);
		doc.startViewTransition(() => {});
		expect(doc.documentElement.dataset.pageDirection).toBe('push');
		finish();
		await finished;
		await Promise.resolve();
		expect(doc.documentElement.dataset.pageDirection).toBeUndefined();
		expect(doc.documentElement.dataset.pageTransition).toBeUndefined();
	});
	it('removes them when the transition is aborted', async () => {
		const doc = fakeDoc(() => settled(Promise.reject(new Error('skipped'))));
		guardViewTransitions(doc);
		doc.startViewTransition(() => {});
		await new Promise((r) => setTimeout(r, 0));
		expect(doc.documentElement.dataset.pageDirection).toBeUndefined();
	});
	it('falls back to a plain update, attributes cleared, when startViewTransition throws', async () => {
		const doc = fakeDoc(() => {
			throw new Error('nope');
		});
		guardViewTransitions(doc);
		let ran = false;
		await doc.startViewTransition(() => void (ran = true)).updateCallbackDone;
		expect(ran).toBe(true);
		expect(doc.documentElement.dataset.pageDirection).toBeUndefined();
	});
	it('keeps the attributes of a newer transition when an older one settles', async () => {
		let finishOld = () => {};
		const old = new Promise<undefined>((resolve) => (finishOld = () => resolve(undefined)));
		let n = 0;
		const doc = fakeDoc(() => settled(n++ === 0 ? old : new Promise<undefined>(() => {})));
		guardViewTransitions(doc);
		doc.startViewTransition(() => {});
		doc.startViewTransition(() => {});
		finishOld();
		await old;
		await Promise.resolve();
		expect(doc.documentElement.dataset.pageDirection).toBe('push');
	});
});

describe('beginPageTransition on a phone', () => {
	const place = (path: string, index: number): Place => ({ path, index, overlay: false });
	const phone = (style: string, dataset: DOMStringMap = {}) => {
		vi.stubGlobal('document', { documentElement: { dataset }, startViewTransition: () => {} });
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		vi.stubGlobal('localStorage', { getItem: () => style, setItem: () => {} });
		return dataset;
	};
	afterEach(() => vi.unstubAllGlobals());

	it('does nothing outside a browser', () => {
		expect(beginPageTransition(undefined, place('/', 0))).toBeUndefined();
	});

	it('marks <html> with the style and the direction', () => {
		const dataset = phone('material');
		expect(beginPageTransition(place('/pickups', 1), place('/pickups/P-4', 2))).toBe('push');
		expect(dataset).toEqual({ pageTransition: 'material', pageDirection: 'push' });
	});

	it('consumes the pending flags even when no transition runs, so they never reach the next navigation', () => {
		phone('none');
		markBackToParent();
		expect(beginPageTransition(place('/pickups/P-4', 1), place('/pickups', 1))).toBeUndefined();
		phone('ios');
		expect(beginPageTransition(place('/pickups', 1), place('/pickups/P-5', 2))).toBe('push');
	});

	it('takes the app’s own notion of a top-level section', () => {
		phone('ios');
		const deep = (path: string) => path.startsWith('/app/') && path.split('/').length <= 3;
		expect(beginPageTransition(place('/app/a', 1), place('/app/b', 2), deep)).toBe('fade');
	});

	it('leaves the attributes of a running transition alone when a later navigation gets none', () => {
		const dataset = phone('ios');
		let finish = () => {};
		const finished = new Promise<undefined>((resolve) => (finish = () => resolve(undefined)));
		const doc: Parameters<typeof guardViewTransitions>[0] = {
			documentElement: { dataset },
			startViewTransition: () => ({ finished, updateCallbackDone: Promise.resolve(undefined) }),
		};
		guardViewTransitions(doc);
		beginPageTransition(place('/pickups', 1), place('/pickups/P-5', 2));
		doc.startViewTransition(() => {});
		expect(dataset.pageDirection).toBe('push');
		phone('none', dataset);
		beginPageTransition(place('/pickups', 2), place('/pickups/P-6', 3));
		expect(dataset.pageDirection).toBe('push');
		finish();
	});
});
