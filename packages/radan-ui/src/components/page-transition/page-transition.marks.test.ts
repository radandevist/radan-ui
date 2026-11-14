import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { goBack } from './page-transition.back';
import type { Place } from './page-transition.contract';
import { beginPageTransition, installPageTransitions } from './page-transition.core';

// This file installs the browser listeners once (module state), on a stand-in window with the Navigation API: a
// traversal is a `navigate` event of type `traverse` (and a popstate too, which must not count it twice).
// page-transition.popstate.test.ts covers the browsers without it.
const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', maxTouchPoints: 5 };
const place = (path: string, index: number): Place => ({ path, index, overlay: false });
const navigation = new EventTarget();
const traverse = () => navigation.dispatchEvent(Object.assign(new Event('navigate'), { navigationType: 'traverse' }));
// What a browser does for one traversal: a navigate event, then popstate.
const swipe = () => {
	traverse();
	window.dispatchEvent(new Event('popstate'));
};
// Going back from /a/1 (entry 2) to /a (entry 1).
const begin = () => beginPageTransition(place('/a/1', 2), place('/a', 1));

beforeAll(() => {
	vi.stubGlobal('window', Object.assign(new EventTarget(), { navigation }));
	vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
	vi.stubGlobal('matchMedia', () => ({ matches: false }));
	vi.stubGlobal('localStorage', { getItem: () => 'ios', setItem: () => {} });
	vi.stubGlobal('navigator', IPHONE);
	installPageTransitions();
});
afterEach(() => {
	vi.useRealTimers();
	// Nothing may be left pending: a lone swipe must still be left to Safari, a lone arrow must not read as a back.
	swipe();
	const leaked = begin() !== undefined || beginPageTransition(place('/a/1', 1), place('/a', 1)) !== undefined;
	if (leaked) {
		throw new Error('a mark leaked out of the test');
	}
});

describe('the app marks, on iOS (a traversal the app did not start is left to Safari)', () => {
	it('keeps a confirmed mark however long the loaders take before the transition starts', async () => {
		vi.useFakeTimers();
		await goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe(); // the browser confirms the traversal
		vi.advanceTimersByTime(10_000); // slow loaders
		expect(begin()).toBe('back');
	});

	it('does not lend an unconfirmed mark (a back() that did nothing) to a later traversal', async () => {
		vi.useFakeTimers();
		await goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		vi.advanceTimersByTime(5000);
		swipe(); // the user's own edge swipe: Safari animates it, the app must not
		expect(begin()).toBeUndefined();
	});

	it('leaves no mark when back() fails, so a later swipe is skipped', async () => {
		await expect(
			goBack({ canGoBack: true, back: () => Promise.reject(new Error('no')), toParent: () => {} }),
		).rejects.toThrow('no');
		swipe();
		expect(begin()).toBeUndefined();
	});
});

describe('one traversal, one confirmation', () => {
	it('drops the mark when a second traversal arrives before the transition starts', async () => {
		vi.useFakeTimers();
		await goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		vi.advanceTimersByTime(1600);
		swipe(); // the user's own swipe, during a slow load
		expect(begin()).toBeUndefined();
	});
});

describe('the parent mark', () => {
	it('is gone once a parent navigation that changed nothing settles, so the next navigation is not a back', async () => {
		await goBack({ canGoBack: false, back: () => {}, toParent: () => Promise.resolve() });
		expect(beginPageTransition(place('/a', 1), place('/b/1', 2))).toBe('push');
	});

	it('survives a slow load before the transition starts, and is consumed by it', async () => {
		vi.useFakeTimers();
		let settle = () => {};
		const slow = new Promise<void>((resolve) => (settle = resolve));
		const done = goBack({ canGoBack: false, back: () => {}, toParent: () => slow });
		vi.advanceTimersByTime(10_000);
		expect(beginPageTransition(place('/a/1', 1), place('/a', 1))).toBe('back');
		settle();
		await done;
	});

	it('lets a second back armed during a slow parent navigation keep its own mark', async () => {
		let settle = () => {};
		const slow = new Promise<void>((resolve) => (settle = resolve));
		const parent = goBack({ canGoBack: false, back: () => {}, toParent: () => slow });
		await goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		settle();
		await parent;
		expect(begin()).toBe('back');
	});
});
