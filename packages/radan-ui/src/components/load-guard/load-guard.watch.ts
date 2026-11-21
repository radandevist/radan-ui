export const PENDING_LIMIT_MS = 15_000;
const POLL_MS = 3_000;

/** What the guard reads of the router (the real one fits). */
export type Guarded = {
	state: { status: string; matches: readonly { status: string }[] };
	invalidate: () => Promise<void>;
};

/**
 * Net 2: a load still pending after `PENDING_LIMIT_MS`, or a router idle with a page still marked pending (the corrupt
 * state ShopKartOS #318 produced), is revalidated once; the check also runs when the tab comes back or the network returns.
 * Starts the watch; returns what stops it. `now` and the timers are the browser's (tests drive them).
 */
export const watchLoad = (router: Guarded, now: () => number = Date.now) => {
	let pendingSince: number | undefined;
	let revalidated = false;
	const revalidate = () => {
		revalidated = true;
		void router.invalidate();
	};
	const check = () => {
		const { status, matches } = router.state;
		if (status === 'pending') {
			pendingSince ??= now();
			if (!revalidated && now() - pendingSince >= PENDING_LIMIT_MS) {
				revalidate();
			}
			return;
		}
		pendingSince = undefined;
		if (matches.some((match) => match.status === 'pending')) {
			if (!revalidated) {
				revalidate();
			}
			return;
		}
		revalidated = false;
	};
	const onVisible = () => {
		if (document.visibilityState === 'visible') {
			check();
		}
	};
	const timer = setInterval(check, POLL_MS);
	window.addEventListener('online', check);
	document.addEventListener('visibilitychange', onVisible);
	return () => {
		clearInterval(timer);
		window.removeEventListener('online', check);
		document.removeEventListener('visibilitychange', onVisible);
	};
};
