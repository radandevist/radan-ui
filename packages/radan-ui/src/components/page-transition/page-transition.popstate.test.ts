import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { goBack } from './page-transition.back';
import type { Place } from './page-transition.contract';
import { beginPageTransition, installPageTransitions } from './page-transition.core';
import { resetMarksForTests } from './page-transition.marks';

// Browsers without the Navigation API: popstate is the traversal event (its own file: the install is module state).
const place = (path: string, index: number): Place => ({ path, index, overlay: false });
const swipe = () => window.dispatchEvent(new Event('popstate'));
const begin = () => beginPageTransition(place('/a/1', 2), place('/a', 1));

beforeAll(() => {
	vi.stubGlobal('window', new EventTarget());
	vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
	vi.stubGlobal('matchMedia', () => ({ matches: false }));
	vi.stubGlobal('localStorage', { getItem: () => 'ios', setItem: () => {} });
	vi.stubGlobal('navigator', {
		userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
		maxTouchPoints: 5,
	});
	installPageTransitions();
});
afterEach(() => {
	vi.useRealTimers();
	resetMarksForTests();
});

describe('on popstate', () => {
	it('leaves a lone swipe to Safari', () => {
		swipe();
		expect(begin()).toBeUndefined();
	});

	it('keeps the mark of the arrow through a slow load (no expiry)', () => {
		vi.useFakeTimers();
		goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		vi.advanceTimersByTime(20_000);
		expect(begin()).toBe('back');
	});

	// ShopKartOS as it is (the S2 hardening drops a mark a second traversal cannot own).
	it('lends the mark to a later swipe (arrow, popstate, 1.6 s, popstate)', () => {
		vi.useFakeTimers();
		goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		vi.advanceTimersByTime(1600);
		swipe();
		expect(begin()).toBe('back');
	});
});
