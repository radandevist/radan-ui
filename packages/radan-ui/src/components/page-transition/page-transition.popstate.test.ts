import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { goBack } from './page-transition.back';
import type { Place } from './page-transition.contract';
import { beginPageTransition, installPageTransitions } from './page-transition.core';

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
	// Nothing may be left pending: a lone swipe must still be left to Safari.
	swipe();
	if (begin() !== undefined) {
		throw new Error('a mark leaked out of the test');
	}
});

describe('on popstate', () => {
	it('keeps the confirmed mark of the arrow through a slow load', async () => {
		vi.useFakeTimers();
		await goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		vi.advanceTimersByTime(10_000);
		expect(begin()).toBe('back');
	});

	it('does not carry a confirmed mark over to a later swipe (arrow, popstate, 1.6 s, popstate)', async () => {
		vi.useFakeTimers();
		await goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		vi.advanceTimersByTime(1600);
		swipe();
		expect(begin()).toBeUndefined();
	});

	it('lets a confirmed mark go after the backstop', async () => {
		vi.useFakeTimers();
		await goBack({ canGoBack: true, back: () => {}, toParent: () => {} });
		swipe();
		vi.advanceTimersByTime(20_000);
		expect(begin()).toBeUndefined();
	});
});
