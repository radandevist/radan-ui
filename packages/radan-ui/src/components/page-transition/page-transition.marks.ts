import type { Via } from './page-transition.contract';

// What the router cannot tell the adapter, each read once by the next transition (`take`): a browser that already
// animated a back (`hasUAVisualTransition` on the navigate event: no second transition), a history traversal
// (popstate), a traversal the app started itself (the arrow, the sheet's close) and the arrow's fallback to the parent.
// Document-wide on purpose: one document, one history.
const pending = { browserAnimated: false, traversal: false, appStarted: false, toParent: false };

/** Reads and clears the flags: a navigation that gets no transition must not leave them to the next one. */
export const take = (): Via & { browserAnimated: boolean; appStarted: boolean } => {
	const seen = { ...pending };
	pending.browserAnimated = pending.traversal = pending.appStarted = pending.toParent = false;
	return seen;
};

/** For tests only: the flags are module state, one document. */
export const resetMarksForTests = () => void take();

/** The back arrow with no earlier entry replaces the page with its parent: that navigation is a back, not a push. */
export const markBackToParent = () => void (pending.toParent = true);

/** A history traversal the app starts itself (the arrow, the sheet's close): it gets the app transition even on iOS. */
export const markAppTraversal = () => void (pending.appStarted = true);

/** Kept exported, a no-op until the hardened marks (S2): the flags are cleared only by the next `take()`. */
export const clearBackToParent = () => {};

/** Kept exported, a no-op until the hardened marks (S2): the flags are cleared only by the next `take()`. */
export const clearMarks = () => {};

/** The browser listeners that arm the flags above. Call once, only where view transitions exist. */
export const listenForTraversals = () => {
	window.addEventListener('popstate', () => void (pending.traversal = true), true);
	// The Navigation API (Chrome, Safari 18.2+): a push or a replace is never a traversal, whatever popstate said before.
	window.navigation?.addEventListener('navigate', (e) => {
		if (e.navigationType !== 'traverse') {
			pending.traversal = false;
		}
		if (e.hasUAVisualTransition) {
			pending.browserAnimated = true;
		}
	});
};
