import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTapGuard, goBack } from './page-transition.back';
import type { Place } from './page-transition.contract';
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
	const phone = () => {
		vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		vi.stubGlobal('localStorage', { getItem: () => 'ios', setItem: () => {} });
	};
	const place = (path: string, index: number): Place => ({ path, index, overlay: false });
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('goes back in history when the app has an earlier entry', async () => {
		const back = vi.fn<() => void>();
		const toParent = vi.fn<() => void>();
		await goBack({ canGoBack: true, back, toParent });
		expect(back).toHaveBeenCalledOnce();
		expect(toParent).not.toHaveBeenCalled();
	});

	it('replaces with the parent otherwise, and that navigation reads as a back', async () => {
		phone();
		const back = vi.fn<() => void>();
		let direction: unknown;
		await goBack({
			canGoBack: false,
			back,
			// The router's commit hook runs inside the navigation. The replace keeps its history index, yet it is a back.
			toParent: () => {
				direction = beginPageTransition(place('/a/1', 1), place('/a', 1));
			},
		});
		expect(back).not.toHaveBeenCalled();
		expect(direction).toBe('back');
	});

	it('rejects with the navigation error and leaves no mark when the parent navigation fails', async () => {
		phone();
		await expect(
			goBack({ canGoBack: false, back: () => {}, toParent: () => Promise.reject(new Error('no')) }),
		).rejects.toThrow('no');
		expect(beginPageTransition(place('/a/1', 1), place('/a', 1))).toBeUndefined();
	});
});
