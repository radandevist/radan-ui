import type { Page } from 'playwright-core';

/**
 * What a resting app must never show; empty when everything is fine: a visible busy region (a skeleton) outside
 * `ignoreSelector`, a router `idle` with a `pending` match, view-transition marks left on `<html>`, a view transition
 * that never finished. Reads `window.__TSR_ROUTER__`.
 */
export const restingProblems = (page: Page, options: { ignoreSelector?: string } = {}): Promise<string[]> =>
	page.evaluate((ignore) => {
		const problems: string[] = [];
		const busy = [...document.querySelectorAll('[aria-busy="true"]:not(a)')].filter(
			(el) => el.getBoundingClientRect().height > 0 && !(ignore && el.closest(ignore)),
		);
		if (busy.length > 0) {
			problems.push(`${busy.length} skeleton(s) still on screen`);
		}
		// The router handle and `activeViewTransition` are not in every typing: read them by name (this runs in the page).
		const state = window.__TSR_ROUTER__?.state;
		if (state && state.status === 'idle' && state.matches.some((m: { status: string }) => m.status === 'pending')) {
			problems.push('router idle with a page still pending');
		}
		const root = document.documentElement.dataset;
		if (root.pageDirection || root.pageTransition) {
			problems.push('view transition marks left on <html>');
		}
		if (document.activeViewTransition) {
			problems.push('a view transition never finished');
		}
		return problems;
	}, options.ignoreSelector);
