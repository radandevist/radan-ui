import { describe, expect, it, vi } from 'vitest';

import { createTapGuard, goBack } from './page-transition.back';
import { beginPageTransition } from './page-transition.core';

describe('the back arrow tap guard', () => {
	it('ignores a second tap inside the window and takes one after it', () => {
		let t = 0;
		const guard = createTapGuard(800, () => t);
		let runs = 0;
		const tap = () =>
			guard(() => {
				runs += 1;
			});
		tap();
		t = 500;
		tap();
		expect(runs).toBe(1);
		t = 801;
		tap();
		expect(runs).toBe(2);
	});

	it('never stays closed after a run that throws', () => {
		let t = 0;
		const guard = createTapGuard(800, () => t);
		expect(() =>
			guard(() => {
				throw new Error('boom');
			}),
		).toThrow('boom');
		t = 900;
		let ran = false;
		guard(() => {
			ran = true;
		});
		expect(ran).toBe(true);
	});
});

describe('goBack', () => {
	it('goes back in history when the app has an earlier entry', () => {
		const back = vi.fn<() => void>();
		const toParent = vi.fn<() => void>();
		expect(goBack({ canGoBack: true, back, toParent })).toBeUndefined();
		expect(back).toHaveBeenCalledOnce();
		expect(toParent).not.toHaveBeenCalled();
	});

	it('replaces with the parent otherwise, and that navigation reads as a back', () => {
		const back = vi.fn<() => void>();
		const done = Promise.resolve();
		expect(goBack({ canGoBack: false, back, toParent: () => done })).toBe(done);
		expect(back).not.toHaveBeenCalled();
		// The replace keeps its history index, yet the page transition reads it as a back.
		vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		vi.stubGlobal('localStorage', { getItem: () => 'ios', setItem: () => {} });
		const place = (path: string) => ({ path, index: 1, overlay: false });
		expect(beginPageTransition(place('/a/1'), place('/a'))).toBe('back');
		vi.unstubAllGlobals();
	});
});
