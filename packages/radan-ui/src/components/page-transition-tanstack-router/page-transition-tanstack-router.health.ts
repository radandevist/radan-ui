import type { EarlyOfferStatus, Health } from './page-transition-tanstack-router.contract';

// What the early skeleton's reads of the router's private state have shown so far: the worst one wins, so a tool that
// reads it after a run sees a mismatch even if a later navigation found nothing to offer.
const RANK: Record<EarlyOfferStatus, number> = {
	untested: 0,
	'no-pending-component': 1,
	ok: 2,
	'shape-mismatch': 3,
};

declare global {
	// A `var`, so `globalThis.__radanUiPageTransitions` is typed.
	// oxlint-disable-next-line no-var -- the only way to declare a global property
	var __radanUiPageTransitions: Health | undefined;
}

/** One adapter's health: `report` for the early offer, `get` for `health()`, published on the window for tools. */
export const createHealth = () => {
	let current: Health = { earlyOffer: 'untested' };
	let warned = false;
	const publish = () => {
		if (globalThis.window) {
			globalThis.__radanUiPageTransitions = { ...current };
		}
	};
	return {
		get: (): Health => ({ ...current }),
		/** A new `install`: nothing is known yet. */
		reset: () => {
			current = { earlyOffer: 'untested' };
			warned = false;
			publish();
		},
		report: (status: Exclude<EarlyOfferStatus, 'untested'>, reason?: string) => {
			if (RANK[status] < RANK[current.earlyOffer]) {
				return;
			}
			current = reason ? { earlyOffer: status, reason } : { earlyOffer: status };
			publish();
			if (status === 'shape-mismatch' && !warned && process.env.NODE_ENV !== 'production') {
				warned = true;
				// oxlint-disable-next-line house/no-console-in-source -- a dev-only diagnostic: the library has no logger
				console.warn(
					`[radan-ui] page transitions: the router's private state changed shape (${reason}); the early skeleton is off. ` +
						'Check the installed @tanstack/react-router against the supported range.',
				);
			}
		},
	};
};
