/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-runtime-typeof, anti-slop/require-safety-comment-for-type-assertion -- the one reader of the router's private state: it checks every shape at runtime, by design */
import type { AnyRouter } from '@tanstack/react-router';

import type { ReportEarlyOffer } from './page-transition-tanstack-router.contract';
import type { Matches, SwapRouter } from './page-transition-tanstack-router.state';

type EarlyRouter = SwapRouter & Pick<AnyRouter, 'subscribe' | '_tx' | 'stores' | 'routesById' | 'options'>;
export type { EarlyRouter };

// Compile-time pin: the loading matches are index 3 of the router's load transaction. A reordered tuple is a type error
// after a bump, not a silent change.
type LoadingMatches = NonNullable<AnyRouter['_tx']>[3];
const pinned: LoadingMatches extends Matches ? true : never = true;
void pinned;

const isMatch = (value: unknown): value is { id: string; routeId: string; status: string } =>
	typeof value === 'object' &&
	value !== null &&
	typeof (value as { routeId?: unknown }).routeId === 'string' &&
	typeof (value as { status?: unknown }).status === 'string';

/**
 * The ONE file that reads the router's private load transaction (`_tx`) and store (`stores`), pinned with
 * @tanstack/react-router (an exact dev version in package.json, a peer window in the range). Failure mode: any
 * unexpected shape returns undefined (no early skeleton is offered; the router's own offer, after the root `beforeLoad`,
 * is all there is), reports `shape-mismatch`, and never throws.
 */
export const earlyOffer = (
	router: EarlyRouter,
	report: ReportEarlyOffer = () => {},
): { matches: Matches; show: () => void } | undefined => {
	try {
		const shown = router.stores.matches.get();
		if (!Array.isArray(shown) || typeof router.stores.setMatches !== 'function') {
			throw new TypeError('router.stores.matches / setMatches changed shape');
		}
		if (router.stores.status.get() !== 'pending') {
			return undefined;
		}
		const tx: unknown = router._tx;
		if (tx === undefined) {
			return undefined;
		}
		const loading: unknown = Array.isArray(tx) ? tx[3] : undefined;
		if (!Array.isArray(loading) || !loading.every(isMatch)) {
			throw new TypeError('router._tx[3] is not the list of loading matches');
		}
		const index = loading.findIndex(
			(match) =>
				match.status !== 'success' &&
				(router.routesById[match.routeId]?.options.pendingComponent ?? router.options.defaultPendingComponent),
		);
		if (index < 0) {
			report('no-pending-component');
			return undefined;
		}
		const there = shown[index];
		if (there?.id === loading[index]?.id && there?.status === 'pending') {
			return undefined;
		}
		// The root's `beforeLoad` has not answered: the shell still reads the context it gave the page on screen.
		const context = shown[0]?.context;
		const offered: Matches = loading.map((match) => ({ ...match, _flight: undefined, ...(context && { context }) }));
		offered[index]!.status = 'pending';
		report('ok');
		return { matches: offered, show: () => router.stores.setMatches(offered) };
	} catch (error) {
		report('shape-mismatch', error instanceof Error ? error.message : String(error));
		return undefined;
	}
};
