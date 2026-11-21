import { useCanGoBack, useRouter, useRouterState, type AnyRouter, type ToOptions } from '@tanstack/react-router';
import { useContext, useLayoutEffect } from 'react';

import { goBack } from '../page-transition/page-transition.back';
import { installPageTransitions } from '../page-transition/page-transition.core';
import { PageTitleContext } from '../phone-top-bar/phone-top-bar.title';
import type { PageTransitionsOptions } from './page-transition-tanstack-router.contract';
import { createHealth } from './page-transition-tanstack-router.health';
import type { EarlyRouter } from './page-transition-tanstack-router.internals';
import { shownPath } from './page-transition-tanstack-router.shown-path';
import { createSwapState } from './page-transition-tanstack-router.state';
import { animatePendingSwap, offerFromClick } from './page-transition-tanstack-router.swap';
import { createViewTransition } from './page-transition-tanstack-router.view-transition';

export { shownPath } from './page-transition-tanstack-router.shown-path';
export type { ShownState } from './page-transition-tanstack-router.shown-path';
export type { EarlyOfferStatus, Health, PageTransitionsOptions } from './page-transition-tanstack-router.contract';

/** A page's skeleton is offered as soon as its load starts and stays 300 ms at least (ShopKartOS, measured on a phone). */
const PENDING_MIN_MS = 300;

/**
 * The router-bound half of the page transitions, for TanStack Router: one transition per navigation, the skeleton inside
 * it and from the click, the stale-offer rule, and the state of the router's private internals.
 *
 * ```ts
 * const pageTransitions = createPageTransitions({ screenParams: ['section'] });
 * const router = createRouter({ routeTree, ...pageTransitions.routerOptions });
 * pageTransitions.install(router);
 * ```
 */
export const createPageTransitions = (options: PageTransitionsOptions = {}) => {
	const health = createHealth();
	// The state `routerOptions` handed to the router being built, claimed by its `install`.
	let fresh: ReturnType<typeof createSwapState> | undefined;
	const installed = new WeakMap<object, () => void>();
	return {
		/** Spread into `createRouter`; read at that call (lazy: the browser's view-transition API is looked at then, never at module load). */
		get routerOptions() {
			fresh = createSwapState();
			return {
				defaultViewTransition: createViewTransition(fresh, options),
				defaultPendingMs: 0 as const,
				defaultPendingMinMs: PENDING_MIN_MS,
			};
		},
		/** After `createRouter`. Browser only (a no-op on the server). Idempotent per router. Returns what undoes it (HMR, tests). */
		install: (router: AnyRouter): (() => void) => {
			if (!globalThis.document) {
				return () => {};
			}
			const done = installed.get(router);
			if (done) {
				return done;
			}
			const state = fresh ?? createSwapState();
			fresh = undefined;
			health.reset();
			if (process.env.NODE_ENV !== 'production' && router.options.defaultPendingMs !== 0) {
				// oxlint-disable-next-line house/no-console-in-source -- a dev-only diagnostic: the library has no logger
				console.warn(
					'[radan-ui] page transitions: createRouter needs `defaultPendingMs: 0` (spread `routerOptions`); the skeleton is not offered from the click without it.',
				);
			}
			installPageTransitions();
			const unswap = animatePendingSwap(router, state);
			// SAFETY: the early skeleton reads the router's private shape through typed, shape-checked access (internals.ts).
			const unsubscribe = offerFromClick(router as EarlyRouter, state, health.report);
			const dispose = () => {
				unsubscribe();
				unswap();
				installed.delete(router);
			};
			installed.set(router, dispose);
			return dispose;
		},
		/** The state of the private-internals contract; also on `window.__radanUiPageTransitions`. */
		health: health.get,
	};
};
export type PageTransitions = ReturnType<typeof createPageTransitions>;

/** `shownPath` for the router's state: the page on screen, never the navigation's target. */
export const useShownPath = (): string => useRouterState({ select: shownPath });

/**
 * The back arrow's handler: `goBack` fed by `useCanGoBack`, `router.history.back` and, with no earlier entry,
 * `navigate({ to: fallback, replace: true })`. Not awaited: a back returns nothing, the parent navigation's promise is handed back.
 */
export const useGoBack = (fallback: ToOptions['to']) => {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	return () =>
		goBack({
			canGoBack,
			back: () => router.history.back(),
			toParent: () => router.navigate({ to: fallback, replace: true }),
		}) || undefined;
};

/**
 * Publishes the page's own title to the phone top bar before the browser paints, under the page being drawn (not the
 * location), so the bar never shows another page's title.
 */
export const usePageTitle = (title: string | undefined) => {
	const { publish } = useContext(PageTitleContext);
	const path = useShownPath();
	useLayoutEffect(() => {
		if (title !== undefined) {
			publish({ path, title });
		}
	}, [publish, path, title]);
};
