import type { Page } from '@playwright/test';
import type { WalkStep } from '@radandevist/radan-ui/qa';

// The demo's navigation kinds, checked in once as the baseline: do not edit between the old and the new build of a refactor.
// Run in this order, on one page; each step leaves the next one's starting point. (The demo has no rail, drawer, screen
// param or notification sheet: an app lists its own kinds, see docs/guides/nav-stress.md.)
// `viewTransition` is left out unless a step says `false`: `true` is not the same call (the router then runs its own transition type).
const navigate = (page: Page, to: string, viewTransition?: false) =>
	page.evaluate(
		([target, vt]) => {
			void window.__TSR_ROUTER__?.navigate(vt === false ? { to: target, viewTransition: false } : { to: target });
		},
		[to, viewTransition] as const,
	);

export const steps: WalkStep[] = [
	{ name: 'first load', run: (page) => page.reload().then(() => undefined) },
	{ name: 'link: top level', run: (page) => page.getByRole('link', { name: '/pickups', exact: true }).click() },
	{ name: 'navigate: top level to top level', run: (page) => navigate(page, '/settings') },
	{
		name: 'link: push a detail page',
		run: (page) => page.getByRole('link', { name: '/pickups/P-1', exact: true }).click(),
	},
	{ name: 'back arrow, with history', run: (page) => page.locator('[data-page-back]').click() },
	{ name: 'history back', run: (page) => page.goBack().then(() => undefined) },
	{ name: 'history forward', run: (page) => page.goForward().then(() => undefined) },
	{ name: 'navigate: viewTransition false', run: (page) => navigate(page, '/pickups', false) },
	{
		name: 'first load, detail page',
		run: async (page) => {
			const url = page.url().split('#')[0]!;
			await page.goto('about:blank');
			await page.goto(`${url}#/pickups/P-2`);
		},
	},
	{ name: 'back arrow, no history (to parent)', run: (page) => page.locator('[data-page-back]').click() },
];
