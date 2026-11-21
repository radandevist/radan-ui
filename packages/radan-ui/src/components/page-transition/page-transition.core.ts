import type { Direction, Environment, Place, TopLevel, TransitionStyle } from './page-transition.contract';
import { directionOf, skipsTraversal, transitionFor } from './page-transition.direction';
import { clearAttributes, guardViewTransitions, viewTransitionRunning } from './page-transition.guard';
import { listenForTraversals, take } from './page-transition.marks';
import { applyMotion, applyStoredMotion, REDUCED_MOTION_QUERY } from './page-transition.motion';
import { appliedStyle, readStyle, STORAGE_KEY, type Store } from './page-transition.style';

/**
 * Native-feeling page transitions below md, on the browser's View Transitions API: the whole viewport (top bar
 * included) animates. Router-agnostic: the chosen style, the direction of a location change, the decision, the
 * direction marking. The animations are CSS only (`page-transition.css`), keyed by `data-page-transition` and
 * `data-page-direction` on <html>. A router adapter only has to build two `Place`s (see the README).
 */
export {
	DEFAULT_STYLE,
	STORAGE_KEY,
	TRANSITION_STYLES,
	appliedStyle,
	isIOS,
	platformStyle,
	readStyle,
} from './page-transition.style';
export { defaultIsTopLevel, directionOf, skipsTraversal, transitionFor } from './page-transition.direction';
export { guardViewTransitions, viewTransitionRunning } from './page-transition.guard';
export { clearBackToParent, clearMarks, markAppTraversal, markBackToParent } from './page-transition.marks';
export { MOTION_SCRIPT, applyMotion, applyStoredMotion } from './page-transition.motion';

const listeners = new Set<() => void>();

/** Remembers the style on this device, applies it to <html data-motion> and tells the subscribers; a blocked storage just keeps the old one. */
export const writeStyle = (style: TransitionStyle, storage?: Store) => {
	try {
		(storage ?? localStorage).setItem(STORAGE_KEY, style);
	} catch {
		// Storage blocked: the style stays as it was.
	}
	applyMotion(style);
	for (const notify of listeners) {
		notify();
	}
};

/** For `useSyncExternalStore`: the style changed in this tab. */
export const subscribeStyle = (notify: () => void) => {
	listeners.add(notify);
	return () => void listeners.delete(notify);
};

const hasMatchMedia = () => globalThis.matchMedia instanceof Function;
// A webview or a test DOM without `matchMedia` cannot run the transition: report it unsupported instead of throwing.
const browserEnvironment = (): Environment => ({
	style: appliedStyle(readStyle()),
	fromMd: hasMatchMedia() && globalThis.matchMedia('(min-width: 48rem)').matches,
	reducedMotion: hasMatchMedia() && globalThis.matchMedia(REDUCED_MOTION_QUERY).matches,
	supported: hasMatchMedia() && 'startViewTransition' in document,
});

let installed = false;
/**
 * Installs the browser listeners and the view-transition guard, once, from the client's boot. The listeners that keep
 * `<html data-motion>` right (another tab changed the style, the reduced-motion setting changed) are always on; the
 * guard and the traversal flags only where transitions can run: elsewhere nothing would ever consume the flags.
 */
export const installPageTransitions = () => {
	if (installed) {
		return;
	}
	installed = true;
	applyStoredMotion();
	// Another tab changed the style: this one follows without a reload.
	globalThis.window?.matchMedia?.(REDUCED_MOTION_QUERY).addEventListener('change', applyStoredMotion);
	globalThis.window?.addEventListener('storage', (e) => e.key === STORAGE_KEY && applyStoredMotion());
	if (globalThis.window && 'startViewTransition' in document) {
		guardViewTransitions(document);
		listenForTraversals();
	}
};

/**
 * Direction marking, for the router's « about to navigate » hook (it must run for every navigation, popstate ones
 * included). Consumes the pending flags, decides, and when a transition will play sets `data-page-transition` and
 * `data-page-direction` on <html> and returns the direction; otherwise returns undefined (a transition still running
 * keeps its attributes: its own settle handler removes them). The adapter returns `[direction]` (or `false`) to its router.
 */
export const beginPageTransition = (
	from: Place | undefined,
	to: Place,
	isTopLevel?: TopLevel,
): Direction | undefined => {
	if (!globalThis.document) {
		return undefined;
	}
	// Consumed first: a navigation that gets no transition must not leave its flags to the next one.
	const { browserAnimated, ...via } = take();
	const env = browserEnvironment();
	const direction = transitionFor(directionOf(from, to, via, isTopLevel), env);
	if (!direction || browserAnimated || skipsTraversal(via)) {
		if (!viewTransitionRunning()) {
			clearAttributes(document);
		}
		return undefined;
	}
	document.documentElement.dataset.pageTransition = env.style;
	document.documentElement.dataset.pageDirection = direction;
	return direction;
};
