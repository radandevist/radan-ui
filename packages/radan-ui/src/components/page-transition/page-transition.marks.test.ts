import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { goBack } from './page-transition.back';
import type { Place } from './page-transition.contract';
import { beginPageTransition, installPageTransitions } from './page-transition.core';
import { markAppTraversal, resetMarksForTests } from './page-transition.marks';

// The marks are ShopKartOS's (spec §11.1, S1): popstate always, `navigate` only to unset or to report the browser's own
// animation, no expiry, no rollback, flags cleared only by the next transition. This file installs the browser listeners
// once (module state) on a stand-in window WITH the Navigation API; page-transition.popstate.test.ts has none.
const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', maxTouchPoints: 5 };
const place = (path: string, index: number): Place => ({ path, index, overlay: false });
const navigation = new EventTarget();
const navigate = (init: { navigationType: string; hasUAVisualTransition?: boolean }) =>
	navigation.dispatchEvent(Object.assign(new Event('navigate'), init));
// What a browser does for one traversal: a navigate event, then popstate.
const swipe = () => {
	navigate({ navigationType: 'traverse' });
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
	resetMarksForTests();
});

describe('on iOS, a traversal the app did not start is left to Safari', () => {
	it('gives a lone swipe no app transition', () => {
		swipe();
		expect(begin()).toBeUndefined();
	});

	it("gives the arrow's back the app transition", () => {
		goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		expect(begin()).toBe('back');
	});

	it('keeps the mark however long the loaders take (no expiry)', () => {
		vi.useFakeTimers();
		goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		vi.advanceTimersByTime(20_000);
		expect(begin()).toBe('back');
	});

	// ShopKartOS as it is: nothing confirms the traversal, so an unconfirmed mark is lent to the next one (the S2 hardening).
	it('lends an unconfirmed mark (a back() that did nothing) to the next traversal', () => {
		vi.useFakeTimers();
		goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		vi.advanceTimersByTime(5000);
		swipe();
		expect(begin()).toBe('back');
	});

	it('is read once: the next traversal is left to Safari again', () => {
		markAppTraversal();
		swipe();
		expect(begin()).toBe('back');
		swipe();
		expect(begin()).toBeUndefined();
	});
});

describe('the Navigation API events', () => {
	it('does not count a push or a replace as a traversal, whatever popstate said before', () => {
		window.dispatchEvent(new Event('popstate'));
		navigate({ navigationType: 'push' });
		expect(begin()).toBe('back');
	});

	it('leaves a navigation the browser already animated to the browser', () => {
		markAppTraversal();
		navigate({ navigationType: 'traverse', hasUAVisualTransition: true });
		window.dispatchEvent(new Event('popstate'));
		expect(begin()).toBeUndefined();
	});
});

describe('the parent mark', () => {
	it('makes the replace a back, and is consumed by it', () => {
		goBack({ canGoBack: false, back: () => {}, toParent: () => {} });
		expect(beginPageTransition(place('/a/1', 1), place('/a', 1))).toBe('back');
		expect(beginPageTransition(place('/a', 1), place('/b/1', 2))).toBe('push');
	});

	it('is consumed by a navigation that gets no transition, so it never reaches the next one', () => {
		goBack({ canGoBack: false, back: () => {}, toParent: () => {} });
		expect(beginPageTransition(place('/a', 1), place('/a', 1))).toBeUndefined();
		expect(beginPageTransition(place('/a', 1), place('/b/1', 2))).toBe('push');
	});
});
