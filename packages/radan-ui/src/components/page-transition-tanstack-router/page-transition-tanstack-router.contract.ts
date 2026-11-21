import type { TopLevel } from '../page-transition/page-transition.contract';

// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- the router's search is app-typed; the adapter only reads the keys the app declares
export type SearchRecord = Record<string, unknown>;

export type PageTransitionsOptions = {
	/** What a top-level screen is (a menu section). Default: the core's `defaultIsTopLevel`. */
	isTopLevel?: TopLevel;
	/** Search params that make one pathname several phone screens, e.g. `['section']`. Default `[]`. */
	screenParams?: readonly string[];
	/** Whether this search has a full-screen overlay open (the notification sheet). Default: never. */
	// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- see SearchRecord
	overlay?: (search: SearchRecord) => boolean;
};

export type EarlyOfferStatus = 'untested' | 'ok' | 'no-pending-component' | 'shape-mismatch';
export type Health = { earlyOffer: EarlyOfferStatus; reason?: string };

/** The state of the private-internals contract. Also published on `window.__radanUiPageTransitions`. */
export type ReportEarlyOffer = (status: Exclude<EarlyOfferStatus, 'untested'>, reason?: string) => void;
