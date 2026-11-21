import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { restingProblems } from './resting';
import { delayRequests, openApp, QaSetupError, type AppConfig, type Ua } from './session';

export type NavStressConfig = AppConfig & {
	/** Top-level pages plus one detail page of each kind (the app seeds the ids). */
	routes: readonly string[];
	/** A seed replays the same taps (not the timings, unless `delayMs` is a number). Default `[1, 2, 3]`. */
	seeds?: readonly number[];
	/** Default 25. */
	rounds?: number;
	/** A skeleton the app keeps on purpose at rest, e.g. `'[data-restore-skeleton]'`. */
	ignoreSelector?: string;
	/** Default `'android'`. */
	ua?: Ua;
	/** `'rand'` (0-900 ms per request, the default) or a fixed delay: the CI smoke uses 300. */
	delayMs?: 'rand' | number;
	/** Where failing rounds' screenshots go. Default: a fresh temp directory. */
	screenshotDir?: string;
};

export type NavStressRun = {
	seed: number;
	rounds: number;
	stuck: { round: number; problems: string[]; shot: string }[];
	/** The adapter's published early-offer state (`window.__radanUiPageTransitions`), undefined when the app has no adapter. `no-pending-component` is reported, not failed. */
	earlyOffer?: string;
};

// Constants until a third app asks: 390 px touch, CPU 4x, 40 ms gap, 4 s rest.
const CPU_RATE = 4;
const GAP_MS = 40;
const REST_MS = 4000;

/** Small seeded generator: a failing seed replays the same taps. */
const random = (seed: number) => {
	let s = seed;
	return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
};

type Published = { earlyOffer?: string; reason?: string } | undefined;

const stressOne = async (config: NavStressConfig, seed: number, out: string): Promise<NavStressRun> => {
	const next = random(seed);
	const rounds = config.rounds ?? 25;
	const browser = await config.launch();
	try {
		const { context, page } = await openApp(browser, config, { ua: config.ua ?? 'android' });
		const cdp = await context.newCDPSession(page);
		await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
		const fixed = config.delayMs === 'rand' ? undefined : config.delayMs;
		await delayRequests(context, config.delayedRequests, () => fixed ?? Math.floor(next() * 900));
		const run: NavStressRun = { seed, rounds, stuck: [] };
		for (let round = 0; round < rounds; round++) {
			const taps = 2 + Math.floor(next() * 5);
			for (let i = 0; i < taps; i++) {
				if (next() < 0.2) {
					await page.goBack({ timeout: 3000 }).catch(() => undefined);
				} else {
					const to = config.routes[Math.floor(next() * config.routes.length)] ?? '/';
					await page.evaluate((t) => window.__TSR_ROUTER__?.navigate({ to: t }), to).catch(() => undefined);
				}
				await page.waitForTimeout(Math.floor(next() * GAP_MS * 3));
			}
			// Rests: every skeleton, transition and load is over well within this.
			await page.waitForTimeout(REST_MS);
			const problems = await restingProblems(page, { ignoreSelector: config.ignoreSelector });
			if (problems.length > 0) {
				const shot = path.join(out, `nav-stress-seed${seed}-round${round}.png`);
				await page.screenshot({ path: shot });
				run.stuck.push({ round, problems, shot });
				break;
			}
		}
		const published: Published = await page.evaluate(() => window.__radanUiPageTransitions);
		if (published?.earlyOffer === 'shape-mismatch') {
			throw new QaSetupError(
				`the page transitions adapter reports a broken router contract (shape-mismatch: ${published.reason ?? 'no reason'}): check the installed router version`,
			);
		}
		run.earlyOffer = published?.earlyOffer;
		return run;
	} finally {
		await browser.close();
	}
};

/**
 * Navigation stress: taps through the app as fast as a thumb can (router navigate and history Back), every loader
 * delayed, the CPU throttled, and fails (returns `stuck`) when the app is left in a state it should never rest in
 * (see `restingProblems`). Throws `QaSetupError` (exit class 2) when the run could not be made: no router handle, or the
 * adapter reports `shape-mismatch`. Against a built app.
 */
export const runNavStress = async (config: NavStressConfig): Promise<NavStressRun[]> => {
	if (config.routes.length === 0) {
		throw new QaSetupError('no routes to tap: the run would pass for nothing');
	}
	const out = config.screenshotDir ?? mkdtempSync(path.join(tmpdir(), 'nav-stress-'));
	const runs: NavStressRun[] = [];
	for (const seed of config.seeds ?? [1, 2, 3]) {
		runs.push(await stressOne(config, seed, out));
	}
	return runs;
};
