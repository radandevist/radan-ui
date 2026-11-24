import type { AnyRouter } from '@tanstack/react-router';

import type { Direction } from '../page-transition/page-transition.contract';
import type { Loc } from './page-transition-tanstack-router.place';

/** One navigation's decision: a direction to play, or `undefined` for a plain update. */
export type DecideTransition = (from: Loc | undefined, to: Loc) => Direction | undefined;

/**
 * What one router's swap, its view transition and its early offer share. A closure per `install`, not module state: two
 * routers (tests, HMR, a second app on the page) never read each other's marks.
 */
export type SwapState = {
	/** Raised by the swap around its call into `startViewTransition`, so the decision knows the skeleton is the one asking. */
	toPending: boolean;
	/**
	 * The location the skeleton's swap already played (or is playing) the transition for: the router's own pending offer
	 * and the commit that follow, for the same location object, are plain updates.
	 */
	swappedFor: Loc | undefined;
	/**
	 * The one decision per navigation, called by the `startViewTransition` wrapper: every path traverses it, including
	 * browsers where the router never calls `types`.
	 */
	decide?: DecideTransition;
	/** What `decide` returned for the location in flight, handed back to the router by `types`. */
	decidedFor?: { to: Loc; direction: Direction | undefined };
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
	decide: undefined,
	decidedFor: undefined,
	commits: 0,
	navStartedAt: undefined,
});

/** What the swap reads of the router: the pair the router hands to `types`, plus the option that says one will start. */
export type SwapRouter = Pick<
	AnyRouter,
	'startTransition' | 'startViewTransition' | 'shouldViewTransition' | 'state'
> & {
	latestLocation: Loc;
	stores: { resolvedLocation: { get: () => Loc | undefined } };
	options: Pick<AnyRouter['options'], 'defaultViewTransition'>;
};
export type Matches = Parameters<SwapRouter['startTransition']>[1];

/** Below md a slow page's skeleton comes from the click; from md the router's usual wait avoids a flash on a quick load. The app's Tailwind `md`. */
export const MD = '(min-width: 48rem)';
