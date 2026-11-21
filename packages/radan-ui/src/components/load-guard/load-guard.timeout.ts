export const FETCH_LIMIT_MS = 20_000;
/** The Error message the app maps to its error screen. */
export const LOAD_TIMEOUT = 'load_timeout';
/** A caller that is an action, not a page load (a CSV export is a GET), sends this header to keep its call unbounded. */
export const NO_LOAD_TIMEOUT = 'x-no-load-timeout';

/** For a query layer's retry policy: no retry on a timeout. */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- a catch block / query-layer error is unknown by nature; it is only compared
export const isLoadTimeout = (error: unknown) => error instanceof Error && error.message === LOAD_TIMEOUT;

export type IsLoaderCall = (input: RequestInfo | URL, init?: RequestInit) => boolean;

const urlOf = (input: RequestInfo | URL) => {
	if (input instanceof Request) {
		return input.url;
	}
	return input instanceof URL ? input.href : input;
};

/** TanStack Start: a GET to `/_serverFn/` without the opt-out header (ShopKartOS's loader test). */
export const isServerFnGet: IsLoaderCall = (input, init) => {
	const request = input instanceof Request ? input : undefined;
	const method = init?.method ?? request?.method ?? 'GET';
	const url = urlOf(input);
	const unbounded = new Headers(init?.headers ?? request?.headers).has(NO_LOAD_TIMEOUT);
	return method.toUpperCase() === 'GET' && url.includes('/_serverFn/') && !unbounded;
};

/** `fetch` that gives a call `isLoaderCall` accepts `limitMs`; anything else is untouched. */
export const withLoadTimeout =
	(inner: typeof fetch, options: { isLoaderCall: IsLoaderCall; limitMs?: number }): typeof fetch =>
	async (input, init) => {
		if (!options.isLoaderCall(input, init)) {
			return inner(input, init);
		}
		// One controller of ours, chained by hand to the caller's signals (no `AbortSignal.any`: Safari < 17.4, old WebViews).
		const ours = new AbortController();
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			ours.abort();
		}, options.limitMs ?? FETCH_LIMIT_MS);
		const callers = [init?.signal, input instanceof Request ? input.signal : undefined].filter((x) => !!x);
		const chained = callers.map((caller) => {
			const abort = () => ours.abort(caller.reason);
			if (caller.aborted) {
				abort();
			}
			caller.addEventListener('abort', abort, { once: true });
			return () => caller.removeEventListener('abort', abort);
		});
		try {
			return await inner(input, { ...init, signal: ours.signal });
		} catch (cause) {
			// Only our own timeout: a caller's abort (a superseded navigation) keeps its own error.
			throw timedOut ? new Error(LOAD_TIMEOUT) : cause;
		} finally {
			clearTimeout(timer);
			for (const undo of chained) {
				undo();
			}
		}
	};
