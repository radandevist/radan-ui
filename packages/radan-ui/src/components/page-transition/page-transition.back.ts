import { markAppTraversal, markBackToParent } from './page-transition.core';

/** What `goBack` needs of the app's router. */
export type BackNavigation = {
	/** Whether the app itself has an earlier entry (an app-owned index, never `history.length`, which counts other sites). */
	canGoBack: boolean;
	/** Goes back one history entry. */
	back: () => void;
	/** Replaces the current entry with the screen's parent (no new entry): the arrow never leaves the app. */
	toParent: () => Promise<void> | void;
};

/**
 * Where the arrow goes: back the way the browser does when the app has history (the screen behind keeps its scroll and
 * its filters), else to the parent, replacing the entry (a deep link, a reload). Marks the navigation so the page
 * transition knows its direction.
 */
export const goBack = ({ canGoBack, back, toParent }: BackNavigation): Promise<void> | void => {
	if (canGoBack) {
		markAppTraversal();
		back();
		return undefined;
	}
	markBackToParent();
	return toParent();
};

/**
 * A second tap within `windowMs` of the first is ignored (it would go back twice). No state outlives the window, so the
 * arrow can never stay dead. ponytail: a time window, not navigation tracking; a back slower than the window could
 * take a second tap, widen it if that ever shows.
 */
export const createTapGuard = (windowMs = 800, now = () => performance.now()) => {
	let last = Number.NEGATIVE_INFINITY;
	return (run: () => void) => {
		const at = now();
		if (at - last < windowMs) {
			return;
		}
		last = at;
		run();
	};
};
