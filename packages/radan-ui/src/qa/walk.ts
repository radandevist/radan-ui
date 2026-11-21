import type { Page } from 'playwright-core';

import { delayRequests, openApp, QaSetupError, waitIdle, type AppConfig, type Ua } from './session';

export type WalkStep = { name: string; run: (page: Page) => Promise<void> };
export type WalkRecord = {
	/** `<ua>/<navigation api present|absent>/<delay>ms` */
	variant: string;
	step: string;
	/** `document.startViewTransition` calls the step caused. */
	startViewTransition: number;
	/** `<html data-page-direction>` at each call, joined by `,` (`-` for none); null with no call. */
	direction: string | null;
	/** `<html data-page-transition>` at each call, same shape. */
	style: string | null;
};

export type WalkConfig = AppConfig & {
	/** The app's navigation kinds, run in order on one page per variant. Checked in once, never edited between the old and the new build. */
	steps: readonly WalkStep[];
	/** Narrow the matrix to one value; omitted = both (`ua`, `navigationApi`) or `[0, 600]` (`delayMs`). */
	ua?: Ua;
	navigationApi?: boolean;
	delayMs?: number;
};

// Fixed far from the code's own thresholds (the 80/150 ms skeleton timers): 0 = the plain-commit path, 600 = the swap path.
const DELAYS = [0, 600];
const REST_MS = 1500;

// Counts and snapshots at each call: `types` has already run, so the marks on <html> are the decision for this call.
export const COUNT_CALLS = `(() => {
	const calls = [];
	window.__radanUiWalk = calls;
	const original = document.startViewTransition;
	if (typeof original !== 'function') return;
	document.startViewTransition = function (...args) {
		const d = document.documentElement.dataset;
		calls.push({ direction: d.pageDirection ?? null, style: d.pageTransition ?? null });
		return original.apply(this, args);
	};
})()`;

// The popstate-only path: the Navigation API is gone before the page's own code runs.
export const NO_NAVIGATION_API = `(() => {
	try { delete window.navigation; } catch {}
	try { delete Window.prototype.navigation; } catch {}
})()`;

type Call = { direction: string | null; style: string | null };

declare global {
	// Set by COUNT_CALLS in the page; a `var`, so `window.__radanUiWalk` is typed in the evaluate callbacks below.
	// oxlint-disable-next-line no-var -- the only way to declare a global property
	var __radanUiWalk: Call[] | undefined;
}

const join = (calls: Call[], key: keyof Call) =>
	calls.length === 0 ? null : calls.map((c) => c[key] ?? '-').join(',');

/**
 * The transition walk, the gate that makes a "no behaviour change" refactor provable: for each scripted navigation, what
 * the app did (`startViewTransition` count, direction, style), over the matrix Android/iOS user agent x Navigation API
 * present/absent x loader delay 0/600 ms. Run it twice on the old build (`old == old`), then on the new one and `diff`
 * the JSON. Needs `document.startViewTransition`: Chromium (WebKit on Linux has none, so it throws QaSetupError there).
 */
export const runTransitionWalk = async (config: WalkConfig): Promise<WalkRecord[]> => {
	const records: WalkRecord[] = [];
	const browser = await config.launch();
	try {
		for (const ua of config.ua ? [config.ua] : (['android', 'ios'] as const)) {
			for (const navigationApi of config.navigationApi === undefined ? [true, false] : [config.navigationApi]) {
				for (const delay of config.delayMs === undefined ? DELAYS : [config.delayMs]) {
					const variant = `${ua}/${navigationApi ? 'navigation-api' : 'popstate-only'}/${delay}ms`;
					const initScripts = navigationApi ? [COUNT_CALLS] : [NO_NAVIGATION_API, COUNT_CALLS];
					const { context, page } = await openApp(browser, config, { ua, initScripts });
					try {
						if (!(await page.evaluate(() => 'startViewTransition' in document))) {
							throw new QaSetupError('this browser has no document.startViewTransition: the walk would record nothing');
						}
						if (navigationApi === (await page.evaluate(() => !('navigation' in window)))) {
							throw new QaSetupError(
								`the Navigation API is ${navigationApi ? 'missing' : 'still present'} in variant ${variant}`,
							);
						}
						await delayRequests(context, config.delayedRequests, () => delay);
						for (const step of config.steps) {
							await page.evaluate(() => window.__radanUiWalk?.splice(0));
							await step.run(page);
							await waitIdle(page);
							await page.waitForTimeout(REST_MS + delay);
							const calls: Call[] = await page.evaluate(() => window.__radanUiWalk ?? []);
							records.push({
								variant,
								step: step.name,
								startViewTransition: calls.length,
								direction: join(calls, 'direction'),
								style: join(calls, 'style'),
							});
						}
					} finally {
						await context.close();
					}
				}
			}
		}
		return records;
	} finally {
		await browser.close();
	}
};
