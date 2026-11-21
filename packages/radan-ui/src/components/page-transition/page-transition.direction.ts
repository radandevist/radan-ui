import type { Direction, Environment, Nav, Place, TopLevel, Via } from './page-transition.contract';
import { isIOS } from './page-transition.style';

/** The default notion of a section of the menu: at most one path segment and no screen of its own. Pass your own to `directionOf`. */
export const defaultIsTopLevel: TopLevel = (place) =>
	place.path.split('/').filter(Boolean).length <= 1 && place.screen === undefined;

/** On iOS a traversal the app did not start (Safari's edge swipe, which animates by itself without saying so) gets no app transition. */
export const skipsTraversal = (via: Via & { appStarted?: boolean }, nav?: Nav): boolean =>
	!!via.traversal && !via.appStarted && isIOS(nav);

/**
 * How `to` follows `from`, or undefined for no transition. First match wins: a first load (no `from`), a replace
 * (same history index) or a change inside one page (filters, tabs, an open drawer) none (a different `screen` is not
 * inside the page: it is another screen); an overlay sheet opening is a push, closing a back; the arrow of a screen
 * with no earlier entry, to its parent, a back; a top-level section to another a fade (Material only: none on iOS; the
 * history Back between two included); a traversal to an earlier entry a back; a traversal to a later entry a push; any
 * other navigation to a screen below the top level a push; anything else a fade.
 */
export const directionOf = (
	from: Place | undefined,
	to: Place,
	via: Via = {},
	isTopLevel: TopLevel = defaultIsTopLevel,
): Direction | undefined => {
	if (!from) {
		return undefined;
	}
	if (from.path === to.path && from.screen === to.screen) {
		if (from.overlay === to.overlay) {
			return undefined;
		}
		return to.overlay ? 'push' : 'back';
	}
	// The arrow's fallback replaces the entry (same index): a back whatever the pages are.
	if (via.toParent) {
		return 'back';
	}
	if (from.index === undefined || to.index === undefined || from.index === to.index) {
		return undefined;
	}
	if (isTopLevel(from) && isTopLevel(to)) {
		return 'fade';
	}
	if (to.index < from.index) {
		return 'back';
	}
	return via.traversal || !isTopLevel(to) ? 'push' : 'fade';
};

/** The direction to animate with, or undefined: no animation with style none, from md, reduced motion or no API. */
export const transitionFor = (direction: Direction | undefined, env: Environment): Direction | undefined =>
	direction &&
	env.style !== 'none' &&
	// iPhone tab switches are instant: only Material fades through between top-level pages.
	!(direction === 'fade' && env.style === 'ios') &&
	!env.fromMd &&
	!env.reducedMotion &&
	env.supported
		? direction
		: undefined;
