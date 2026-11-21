import { afterEach, describe, expect, it, vi } from 'vitest';

import { markBackToParent } from '../page-transition/page-transition.core';
import { earlyOffer } from './page-transition-tanstack-router.internals';
import { createSwapState, type SwapRouter } from './page-transition-tanstack-router.state';
import { animatePendingSwap, offerFromClick } from './page-transition-tanstack-router.swap';
import { createViewTransition } from './page-transition-tanstack-router.view-transition';

// Ported from ShopKartOS's `pending-swap.test.ts` (origin/main): assertions untouched; the edits are mechanical (the swap
// and `types` take their per-router state instead of reading module state, `pageViewTransition` is
// `createViewTransition(state, {})`).
describe('the pending skeleton swap', () => {
	type Router = SwapRouter;
	type Matches = Parameters<Router['startTransition']>[1];
	// SAFETY: the wrap reads only each match's `status`.
	const matches = (status: string) => [{ status }] as Matches;
	const loc = (pathname: string, index: number) => ({ pathname, search: {}, state: { __TSR_index: index } });
	// The `types` of the router under test (`fakeRouter` builds it with the router's own state).
	let pageViewTransition = createViewTransition(createSwapState(), {});
	/** A router whose view transition asks `types` like the real one, and logs what runs inside it. */
	const fakeRouter = (log: string[], to = loc('/forwarders', 2)) => {
		const state = createSwapState();
		pageViewTransition = createViewTransition(state, {});
		const router: Router = {
			// SAFETY: the wrap reads only `state.status` and `state.location.href`.
			state: {
				status: 'pending',
				location: { href: '/forwarders' },
				matches: [] as Router['state']['matches'],
			} as Router['state'],
			startTransition: async (fn: () => void) => {
				log.push('render');
				fn();
				return true;
			},
			startViewTransition: async (fn: () => Promise<void>) => {
				log.push(
					`vt:${JSON.stringify(pageViewTransition.types({ fromLocation: loc('/pickups', 1), toLocation: to }))}`,
				);
				await fn();
			},
		};
		animatePendingSwap(router, state);
		return router;
	};
	afterEach(() => vi.unstubAllGlobals());
	const phone = () => {
		vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		vi.stubGlobal('localStorage', { getItem: () => 'material', setItem: () => {} });
	};

	it('draws the skeleton inside the navigation view transition, so the header changes with it', async () => {
		phone();
		const log: string[] = [];
		const router = fakeRouter(log);
		await router.startTransition(() => log.push('set'), matches('pending'));
		expect(log).toEqual(['vt:["fade"]', 'render', 'set']);
	});

	it('leaves any other render outside a view transition (the router wraps the commit itself)', async () => {
		phone();
		const log: string[] = [];
		await fakeRouter(log).startTransition(() => log.push('set'), matches('success'));
		expect(log).toEqual(['render', 'set']);
	});

	/** What the router does for one navigation: the skeleton's swap, then the commit, both for `to`. */
	const navigate = async (log: string[], to = loc('/forwarders', 2)) => {
		await fakeRouter(log, to).startTransition(() => {}, matches('pending'));
		return pageViewTransition.types({ fromLocation: loc('/pickups', 1), toLocation: to });
	};

	it('plays exactly one transition for a slow page: the commit after the skeleton is a plain update', async () => {
		phone();
		const log: string[] = [];
		expect(await navigate(log)).toBe(false);
		expect(log.filter((entry) => entry.startsWith('vt:'))).toEqual(['vt:["fade"]']);
	});

	it('reads the navigation flags once, at the swap (a back stays a back)', async () => {
		phone();
		markBackToParent();
		const log: string[] = [];
		await fakeRouter(log).startTransition(() => {}, matches('pending'));
		expect(log[0]).toBe('vt:["back"]');
	});

	it('a fast page (no skeleton) still animates at its commit', () => {
		phone();
		fakeRouter([]);
		expect(pageViewTransition.types({ fromLocation: loc('/pickups', 1), toLocation: loc('/forwarders', 2) })).toEqual([
			'fade',
		]);
	});

	it('keeps navigate({ viewTransition: false }) for the commit: the swap leaves it unspent', async () => {
		phone();
		const log: string[] = [];
		const router = fakeRouter(log);
		router.shouldViewTransition = false;
		await router.startTransition(() => log.push('set'), matches('pending'));
		expect(log).toEqual(['render', 'set']);
		expect(router.shouldViewTransition).toBe(false);
	});

	/** One task: the swap waits that long before it starts its view transition. */
	const tick = () => new Promise((resolve) => setTimeout(resolve, 1));
	/** A router whose view transition runs its update callback only when `release()` is called (the browser defers it). */
	const deferredRouter = () => {
		const log: string[] = [];
		let release = () => {};
		const router = fakeRouter(log);
		const started = router.startViewTransition;
		router.startViewTransition = (fn) =>
			started(
				() =>
					new Promise<void>((resolve) => {
						release = () => void fn().then(resolve);
					}),
			);
		return { router, log, release: () => release() };
	};

	it('does not paint a stale skeleton when the page committed before the deferred callback ran', async () => {
		phone();
		const { router, log, release } = deferredRouter();
		const swap = router.startTransition(() => log.push('set'), matches('pending'));
		await tick();
		// The load finished and committed the real page while the browser held the callback.
		// SAFETY: the double's `state` is the plain object built in `fakeRouter`.
		(router.state as { status: string }).status = 'idle';
		release();
		expect(await swap).toBe(false);
		expect(log).not.toContain('set');
		expect(log).not.toContain('render');
	});

	it('does not paint a stale skeleton in the gap between the commit and the router going idle', async () => {
		phone();
		const { router, log, release } = deferredRouter();
		const swap = router.startTransition(() => log.push('set'), matches('pending'));
		await tick();
		// The load committed its matches, but `status` stays pending until the commit's transition is acknowledged.
		// SAFETY: the double's `state` is the plain object built in `fakeRouter`.
		(router.state as { matches: unknown[] }).matches = [{ status: 'success' }];
		release();
		await swap;
		expect(log).not.toContain('set');
	});

	it('does not paint the skeleton of a navigation a newer one superseded', async () => {
		phone();
		const { router, log, release } = deferredRouter();
		const swap = router.startTransition(() => log.push('set'), matches('pending'));
		await tick();
		// SAFETY: the double's `state.location` is the plain object built in `fakeRouter`.
		(router.state.location as { href: string }).href = '/settings';
		release();
		await swap;
		expect(log).not.toContain('set');
	});

	it('still paints the skeleton when the callback runs while the same load is pending', async () => {
		phone();
		const { router, log, release } = deferredRouter();
		const swap = router.startTransition(() => log.push('set'), matches('pending'));
		await tick();
		release();
		expect(await swap).toBe(true);
		expect(log).toContain('set');
	});

	it('a superseded navigation never leaves its mark to the next one to the same page', async () => {
		phone();
		const router = fakeRouter([]);
		// The first tap swapped its skeleton, then was superseded before its commit.
		await router.startTransition(() => {}, matches('pending'));
		// The second tap (same page, its own location object) is fast: it decides for itself and animates.
		expect(pageViewTransition.types({ fromLocation: loc('/pickups', 1), toLocation: loc('/forwarders', 2) })).toEqual([
			'fade',
		]);
	});

	it('shows no skeleton for a page that commits within the same task (data already cached)', async () => {
		phone();
		const log: string[] = [];
		const router = fakeRouter(log);
		const skeleton = router.startTransition(() => log.push('skeleton'), matches('pending'));
		await router.startTransition(() => log.push('commit'), matches('success'));
		expect(await skeleton).toBe(false);
		expect(log).toEqual(['render', 'commit']);
	});

	it('starts no second view transition while the commit one is in flight (one decision per navigation)', async () => {
		phone();
		const log: string[] = [];
		const router = fakeRouter(log);
		const swap = router.startTransition(() => log.push('set'), matches('pending'));
		// The load committed in microtasks: the router starts the navigation's transition (its callback runs next frame).
		await router.startViewTransition(async () => {});
		expect(await swap).toBe(false);
		expect(log.filter((entry) => entry.startsWith('vt:'))).toHaveLength(1);
		expect(log).not.toContain('set');
	});

	it('from md the skeleton keeps a 150 ms wait (no transition carries it there)', async () => {
		vi.useFakeTimers();
		try {
			vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
			vi.stubGlobal('matchMedia', () => ({ matches: true }));
			vi.stubGlobal('localStorage', { getItem: () => 'material', setItem: () => {} });
			const log: string[] = [];
			const swap = fakeRouter(log).startTransition(() => log.push('skeleton'), matches('pending'));
			await vi.advanceTimersByTimeAsync(149);
			expect(log).toEqual([]);
			await vi.advanceTimersByTimeAsync(1);
			await swap;
			expect(log).toContain('skeleton');
		} finally {
			vi.useRealTimers();
		}
	});

	describe('the early skeleton (the root beforeLoad is slow)', () => {
		/** A router whose root `beforeLoad` is still running: the new page's match waits, the session is `pending`. */
		const slowRoot = (width: boolean) => {
			vi.useFakeTimers();
			vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
			vi.stubGlobal('matchMedia', () => ({ matches: width }));
			vi.stubGlobal('localStorage', { getItem: () => 'material', setItem: () => {} });
			let onBeforeLoad: (event: { pathChanged: boolean }) => void = () => {};
			const offered: Matches[] = [];
			const router = {
				subscribe: (_: string, fn: typeof onBeforeLoad) => {
					onBeforeLoad = fn;
				},
				_tx: [
					0,
					0,
					0,
					[
						{ id: 'root', routeId: '__root__', status: 'success' },
						{ id: 'page', routeId: '/p', status: 'pending' },
					],
				],
				stores: { status: { get: () => 'pending' }, matches: { get: () => [] }, setMatches: () => {} },
				routesById: { '/p': { options: { pendingComponent: () => null } } },
				options: {},
				startTransition: async (_fn: () => void, expected: Matches) => {
					offered.push(expected);
				},
				startViewTransition: async (fn: () => Promise<void>) => {
					await fn();
				},
			};
			// SAFETY: `offerFromClick` reads only the members the fake above provides.
			// oxlint-disable-next-line house/no-never-any-casts -- a partial router fake
			offerFromClick(router as never, createSwapState());
			return { fire: () => onBeforeLoad({ pathChanged: true }), offered };
		};

		it('offers the next page skeleton 80 ms after the click, below md', async () => {
			try {
				const { fire, offered } = slowRoot(false);
				fire();
				await vi.advanceTimersByTimeAsync(79);
				expect(offered).toEqual([]);
				await vi.advanceTimersByTimeAsync(2);
				expect(offered).toHaveLength(1);
				expect(offered[0]?.map((m) => m.status)).toEqual(['success', 'pending']);
			} finally {
				vi.useRealTimers();
			}
		});

		it('leaves md and wider to the router (no early skeleton)', async () => {
			try {
				const { fire, offered } = slowRoot(true);
				fire();
				await vi.advanceTimersByTimeAsync(500);
				expect(offered).toEqual([]);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	it('the early skeleton fails safe on an unexpected router shape (no throw, no offer)', () => {
		// SAFETY: a deliberately wrong router, to prove the single private-state reader never throws.
		// oxlint-disable-next-line house/no-never-any-casts -- a deliberately wrong router
		expect(earlyOffer({ _tx: 'nope', stores: {} } as never)).toBeUndefined();
	});
});
