import type { Place } from '../page-transition/page-transition.contract';
import type { PageTransitionsOptions, SearchRecord } from './page-transition-tanstack-router.contract';

/** The part of the router's location the adapter reads (history position, search, path). */
export type Loc = {
	pathname: string;
	search?: SearchRecord | null;
	state?: { __TSR_index?: number } | null;
};

const screenOf = (search: Loc['search'], screenParams: readonly string[]) => {
	const param = screenParams.find((name) => search?.[name]);
	return param && `${param}=${String(search?.[param])}`;
};

/** The core's `Place` for a router location: path, history position, overlay, and the declared screen param. */
export const placeOf = (loc: Loc | undefined, options: PageTransitionsOptions): Place | undefined =>
	loc && {
		path: loc.pathname,
		index: loc.state?.__TSR_index,
		overlay: options.overlay?.(loc.search ?? {}) ?? false,
		screen: screenOf(loc.search, options.screenParams ?? []),
	};
