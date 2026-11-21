export type ShownState = {
	matches: readonly { routeId: string; pathname: string }[];
	location: { pathname: string };
	resolvedLocation?: { pathname: string };
};

/**
 * The path of the page the router renders right now. NOT `state.location`: that already holds the next page's path
 * while a navigation loads and the old page (then its skeleton) is still drawn, which made the header read the next
 * title ~700 ms before the page. The matches are exactly what is on screen: the old page's, then, once the pending
 * skeleton is offered, the next page's, and the swap goes through the shared view transition, so the title, the
 * actions and the body change together. A root-only match (404) has no page of its own.
 */
export const shownPath = (state: ShownState): string => {
	const leaf = state.matches.at(-1);
	const path = !leaf || leaf.routeId === '__root__' ? state.location.pathname : leaf.pathname;
	return path.length > 1 ? path.replace(/\/$/, '') : path;
};
