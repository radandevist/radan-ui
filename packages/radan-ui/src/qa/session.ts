import type { Browser, BrowserContext, Page } from 'playwright-core';

// Node-only: nothing here may reach a web bundle, and Playwright is only ever a type (the app passes `launch`).

/** The run itself could not be made (no router handle, the adapter reports a broken contract): exit class 2, never a green run. */
export class QaSetupError extends Error {
	override name = 'QaSetupError';
}

export type Ua = 'android' | 'ios';
export const USER_AGENT: Record<Ua, string> = {
	android:
		'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36',
	ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
};

/** What every run needs from the app. */
export type AppConfig = {
	baseUrl: string;
	launch: () => Promise<Browser>;
	login: (page: Page) => Promise<void>;
	/** Requests to hold back (the app's loaders): a glob or a RegExp, e.g. everything under `_serverFn`. */
	delayedRequests: string | RegExp;
};

const ROUTER_WAIT_MS = 10_000;

/** Wait until the router is idle: a step's navigation, its skeleton and its commit are over. */
export const waitIdle = (page: Page, timeout = 10_000) =>
	page
		.waitForFunction(() => window.__TSR_ROUTER__?.state?.status === 'idle', undefined, { timeout })
		.catch(() => undefined);

/**
 * A phone-sized page, logged in, on the app, with the router handle verified. Fails loudly (QaSetupError) when the
 * page exposes no `window.__TSR_ROUTER__`: the taps of a run would do nothing and the run would pass for nothing.
 */
export const openApp = async (
	browser: Browser,
	config: AppConfig,
	options: { ua: Ua; initScripts?: string[] },
): Promise<{ context: BrowserContext; page: Page }> => {
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		hasTouch: true,
		isMobile: true,
		userAgent: USER_AGENT[options.ua],
	});
	for (const script of options.initScripts ?? []) {
		await context.addInitScript(script);
	}
	const page = await context.newPage();
	await page.goto(config.baseUrl);
	await config.login(page);
	const hasRouter = await page
		.waitForFunction(() => !!window.__TSR_ROUTER__, undefined, { timeout: ROUTER_WAIT_MS })
		.then(() => true)
		.catch(() => false);
	if (!hasRouter) {
		throw new QaSetupError(
			'window.__TSR_ROUTER__ is missing: the app does not expose its router, the taps would do nothing',
		);
	}
	await waitIdle(page);
	return { context, page };
};

/** Hold back every request matching the app's loaders by `ms()` milliseconds. */
export const delayRequests = (context: BrowserContext, pattern: string | RegExp, ms: () => number) =>
	context.route(pattern, async (route) => {
		await new Promise((resolve) => setTimeout(resolve, ms()));
		await route.continue().catch(() => undefined);
	});
