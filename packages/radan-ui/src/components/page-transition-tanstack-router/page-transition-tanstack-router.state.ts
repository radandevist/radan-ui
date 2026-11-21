import type { AnyRouter } from '@tanstack/react-router';

import type { Loc } from './page-transition-tanstack-router.place';

/**
 * What one router's swap, its view transition and its early offer share. A closure per `install`, not module state: two
 * routers (tests, HMR, a second app on the page) never read each other's marks.
 */
export type SwapState = {
	/** Raised by the swap around its call into `startViewTransition`, so `types` knows the skeleton is the one asking. */
	toPending: boolean;
	/** The location the skeleton's swap already played the transition for: the commit that follows is a plain update. */
	swappedFor: Loc | undefined;
	/**
	 * What a skeleton waiting its turn must not outlive: a commit's `startTransition` AND a commit's view transition
	 * started. One decision per navigation.
	 */
	commits: number;
	/** When the current navigation started (from md the skeleton's wait is counted from here). */
	navStartedAt: number | undefined;
};

export const createSwapState = (): SwapState => ({
	toPending: false,
	swappedFor: undefined,
	commits: 0,
	navStartedAt: undefined,
});

/** What the swap and the early offer read of the router, all of it public API. */
export type SwapRouter = Pick<AnyRouter, 'startTransition' | 'startViewTransition' | 'shouldViewTransition' | 'state'>;
export type Matches = Parameters<SwapRouter['startTransition']>[1];

/** Below md a slow page's skeleton comes from the click; from md the router's usual wait avoids a flash on a quick load. The app's Tailwind `md`. */
export const MD = '(min-width: 48rem)';
