import type { AnyRouter } from '@tanstack/react-router';

/**
 * Called when the skeleton swap is offered: returns a check for the browser-deferred callback. The offer is stale once
 * the router left `pending`, a newer navigation took over (another location) or the load committed (its matches replaced the
 * ones the offer was built on: true from the commit itself, while `status` goes idle one transition later).
 */
export const staleOffer = (router: Pick<AnyRouter, 'state'>) => {
	const { matches } = router.state;
	const { href } = router.state.location;
	return () => {
		const now = router.state;
		return now.status !== 'pending' || now.location.href !== href || now.matches !== matches;
	};
};
