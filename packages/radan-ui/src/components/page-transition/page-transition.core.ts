import type {
	AppliedStyle,
	Direction,
	Environment,
	Nav,
	Place,
	TransitionStyle,
	Via,
} from './page-transition.contract';

/**
 * Native-feeling page transitions below md, on the browser's View Transitions API: the whole viewport (top bar
 * included) animates. Router-agnostic: the chosen style, the direction of a location change, the decision, the
 * direction marking. The animations are CSS only (`page-transition.css`), keyed by `data-page-transition` and
 * `data-page-direction` on <html>. A router adapter only has to build two `Place`s (see the README).
 */
export const TRANSITION_STYLES: readonly TransitionStyle[] = ['auto', 'ios', 'material', 'none'];
export const DEFAULT_STYLE: TransitionStyle = 'auto';
export const STORAGE_KEY = 'radan-ui:page-transition';
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const isStyle = (value: string | null): value is TransitionStyle => TRANSITION_STYLES.some((s) => s === value);

/** The style chosen on this device; the default when nothing valid is stored or storage is blocked. */
export const readStyle = (storage?: Store): TransitionStyle => {
	try {
		const value = (storage ?? localStorage).getItem(STORAGE_KEY);
		return isStyle(value) ? value : DEFAULT_STYLE;
	} catch {
		return DEFAULT_STYLE;
	}
};

/** The platform's style: Android -> material; iPhone, iPad (also an iPadOS reporting as a touch Mac), desktop, unknown -> ios. */
export const platformStyle = (nav: Nav | undefined = globalThis.navigator): AppliedStyle => {
	const platform = nav?.userAgentData?.platform ?? '';
	return /android/i.test(platform) || (!platform && /android/i.test(nav?.userAgent ?? '')) ? 'material' : 'ios';
};

/** The style that really plays: the chosen one, `auto` resolved by the platform. */
export const appliedStyle = (style: TransitionStyle, nav?: Nav): AppliedStyle =>
	style === 'auto' ? platformStyle(nav) : style;

const listeners = new Set<() => void>();

/** Remembers the style on this device and tells the subscribers; a blocked storage just keeps the old one. */
export const writeStyle = (style: TransitionStyle, storage?: Store) => {
	try {
		(storage ?? localStorage).setItem(STORAGE_KEY, style);
	} catch {
		// Storage blocked: the style stays as it was.
	}
	for (const notify of listeners) {
		notify();
	}
};

/** For `useSyncExternalStore`: the style changed in this tab. */
export const subscribeStyle = (notify: () => void) => {
	listeners.add(notify);
	return () => void listeners.delete(notify);
};

/** The default notion of a section of the menu: at most one path segment. Pass your own to `directionOf`. */
export const defaultIsTopLevel = (path: string) => path.split('/').filter(Boolean).length <= 1;

/** Whether the platform is iOS or iPadOS (an iPad asking for the desktop site reports a Mac user agent with touch points). */
export const isIOS = (nav: Nav | undefined = globalThis.navigator): boolean =>
	/iPhone|iPad|iPod/.test(nav?.userAgent ?? '') ||
	(/Macintosh/.test(nav?.userAgent ?? '') && (nav?.maxTouchPoints ?? 0) > 1);

/** On iOS a traversal the app did not start (Safari's edge swipe, which animates by itself without saying so) gets no app transition. */
export const skipsTraversal = (via: Via & { appStarted?: boolean }, nav?: Nav): boolean =>
	!!via.traversal && !via.appStarted && isIOS(nav);

/**
 * How `to` follows `from`, or undefined for no transition. First match wins: a first load (no `from`), a replace
 * (same history index) or a change inside one page (filters, tabs, an open drawer) none; the arrow of a screen with no
 * earlier entry, to its parent, a back (even on the same path, a search change only); an overlay sheet opening is a
 * push, closing a back; a top-level section to another a fade (the history Back between two included); a traversal to
 * an earlier entry a back; a traversal to a later entry a push; any other navigation to a screen below the top level a push; anything else a fade.
 */
export const directionOf = (
	from: Place | undefined,
	to: Place,
	via: Via = {},
	isTopLevel: (path: string) => boolean = defaultIsTopLevel,
): Direction | undefined => {
	if (!from) {
		return undefined;
	}
	// The arrow's fallback replaces the entry (same index): a back whatever the pages are.
	if (via.toParent) {
		return 'back';
	}
	if (from.path === to.path) {
		if (from.overlay === to.overlay) {
			return undefined;
		}
		return to.overlay ? 'push' : 'back';
	}
	if (from.index === undefined || to.index === undefined || from.index === to.index) {
		return undefined;
	}
	if (isTopLevel(from.path) && isTopLevel(to.path)) {
		return 'fade';
	}
	if (to.index < from.index) {
		return 'back';
	}
	return via.traversal || !isTopLevel(to.path) ? 'push' : 'fade';
};

/** The direction to animate with, or undefined: no animation with style none, from md, reduced motion or no API. */
export const transitionFor = (direction: Direction | undefined, env: Environment): Direction | undefined =>
	direction && env.style !== 'none' && !env.fromMd && !env.reducedMotion && env.supported ? direction : undefined;

const hasMatchMedia = () => globalThis.matchMedia instanceof Function;
// A webview or a test DOM without `matchMedia` cannot run the transition: report it unsupported instead of throwing.
const browserEnvironment = (): Environment => ({
	style: appliedStyle(readStyle()),
	fromMd: hasMatchMedia() && globalThis.matchMedia('(min-width: 48rem)').matches,
	reducedMotion: hasMatchMedia() && globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,
	supported: hasMatchMedia() && 'startViewTransition' in document,
});

// What the router cannot tell the adapter, each read once by the next transition (`take`): a browser that already
// animated a back (`hasUAVisualTransition` on the navigate event: no second transition), a history traversal
// (popstate), a traversal the app started itself (the arrow, the sheet's close) and the arrow's fallback to the parent.
// The two marks the app arms itself. `toParent` is armed with its own navigation (the arrow calls the router at once)
// and cleared by `goBack` when that navigation settles or fails, so it never outlives it. `appStarted` waits for the
// browser to confirm the traversal (one traversal event per traversal: popstate, or `navigate` of type `traverse` where
// the Navigation API exists). The confirmation belongs to that first traversal: a second one before the transition
// starts is someone else's (the user's own swipe) and drops the mark. Unconfirmed, (a `back()` that did nothing) it
// expires after UNCONFIRMED_TTL_MS; confirmed it waits out slow loaders, with CONFIRMED_TTL_MS as a backstop.
const UNCONFIRMED_TTL_MS = 1500;
const CONFIRMED_TTL_MS = 15_000;
const pending = {
	browserAnimated: false,
	traversal: false,
	appStarted: false,
	confirmed: false,
	toParent: false,
	armedAt: 0,
};
const expire = () => {
	const ttl = pending.confirmed ? CONFIRMED_TTL_MS : UNCONFIRMED_TTL_MS;
	if (pending.appStarted && performance.now() - pending.armedAt > ttl) {
		pending.appStarted = pending.confirmed = false;
	}
};
const onTraversal = () => {
	expire();
	if (pending.confirmed) {
		// A second traversal before the first one's transition started: the mark was not for this one.
		pending.appStarted = pending.confirmed = false;
	} else {
		pending.confirmed = pending.appStarted;
	}
	pending.traversal = true;
};
const take = () => {
	expire();
	const seen = {
		browserAnimated: pending.browserAnimated,
		traversal: pending.traversal,
		appStarted: pending.appStarted,
		toParent: pending.toParent,
	};
	pending.browserAnimated = pending.traversal = pending.appStarted = pending.confirmed = pending.toParent = false;
	return seen;
};

/** The back arrow with no earlier entry replaces the page with its parent: that navigation is a back, not a push. */
export const markBackToParent = () => void (pending.toParent = true);

/** Forgets the parent mark only (its navigation settled: a later back may already have armed its own mark). */
export const clearBackToParent = () => void (pending.toParent = false);

/** Forgets both app marks (a navigation that failed must not leave them for the next one). */
export const clearMarks = () => void (pending.appStarted = pending.confirmed = pending.toParent = false);

/** A history traversal the app starts itself (the arrow, the sheet's close): it gets the app transition even on iOS. */
export const markAppTraversal = () => {
	pending.appStarted = true;
	pending.confirmed = false;
	pending.armedAt = performance.now();
};

type StartArg = Parameters<Document['startViewTransition']>[0];
/** What a router reads from a started transition, and what the guard needs of a document. */
type Settleable = Pick<ViewTransition, 'finished' | 'updateCallbackDone'> &
	Partial<Pick<ViewTransition, 'ready' | 'skipTransition' | 'types'>>;
type GuardedDocument = {
	documentElement: { dataset: DOMStringMap };
	startViewTransition: (arg: StartArg) => Settleable;
};

const clearAttributes = (doc: Pick<GuardedDocument, 'documentElement'>) => {
	delete doc.documentElement.dataset.pageTransition;
	delete doc.documentElement.dataset.pageDirection;
};

/** The newest view transition still running: its settle handler owns the attributes' cleanup. */
let inFlight: Settleable | undefined;

/**
 * Wraps `startViewTransition` once: the attributes the CSS reads are removed when the transition settles (finished,
 * skipped or aborted) unless a newer one has taken over, and a throw falls back to a plain update.
 */
export const guardViewTransitions = (doc: GuardedDocument) => {
	const original = doc.startViewTransition.bind(doc);
	doc.startViewTransition = (arg) => {
		try {
			const transition = original(arg);
			inFlight = transition;
			const settled = () => {
				if (inFlight === transition) {
					inFlight = undefined;
					clearAttributes(doc);
				}
			};
			transition.finished.then(settled, settled);
			return transition;
		} catch {
			clearAttributes(doc);
			const update = arg instanceof Function ? arg : arg?.update;
			const done = Promise.resolve().then(() => update?.());
			// The whole ViewTransition contract, settled: callers may await `ready` or call `skipTransition`.
			return {
				ready: done,
				finished: done,
				updateCallbackDone: done,
				skipTransition: () => {},
				types: new Set<string>(),
			};
		}
	};
};

let installed = false;
/**
 * Installs the browser listeners and the view-transition guard, once, from the client's boot. Only where transitions
 * can run: elsewhere nothing would ever consume the flags.
 */
export const installPageTransitions = () => {
	if (installed || !globalThis.window || !globalThis.document || !('startViewTransition' in document)) {
		return;
	}
	installed = true;
	guardViewTransitions(document);
	const navigation = window.navigation;
	if (!navigation) {
		window.addEventListener('popstate', onTraversal, true);
		return;
	}
	// The Navigation API (Chrome, Safari 18.2+) reports every navigation once: only a `traverse` is a traversal, and
	// popstate (which fires for it too) is not listened to, so one traversal is never counted twice.
	navigation.addEventListener('navigate', (e) => {
		if (e.navigationType === 'traverse') {
			onTraversal();
		} else {
			pending.traversal = false;
		}
		if (e.hasUAVisualTransition) {
			pending.browserAnimated = true;
		}
	});
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
	isTopLevel?: (path: string) => boolean,
): Direction | undefined => {
	if (!globalThis.document) {
		return undefined;
	}
	// Consumed first: a navigation that gets no transition must not leave its flags to the next one.
	const { browserAnimated, ...via } = take();
	const env = browserEnvironment();
	const direction = transitionFor(directionOf(from, to, via, isTopLevel), env);
	if (!direction || browserAnimated || skipsTraversal(via)) {
		if (!inFlight) {
			clearAttributes(document);
		}
		return undefined;
	}
	document.documentElement.dataset.pageTransition = env.style;
	document.documentElement.dataset.pageDirection = direction;
	return direction;
};
