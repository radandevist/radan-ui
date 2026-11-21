import { runNavStress, QaSetupError } from '@radandevist/radan-ui/qa';

import { demo, serveDemo } from './demo.ts';

// The app-side recipe (docs/guides/nav-stress.md): serve the built app, run, map the result to an exit code (0 clean, 1 stuck, 2 not runnable).
// `--smoke`: the short fixed run CI does on every PR; no flag: the full run (nightly).
const smoke = process.argv.includes('--smoke')
	? { seeds: [1], rounds: 5, delayMs: 300, taps: 'fire' as const }
	: undefined;
const server = await serveDemo();
let code = 0;
try {
	const runs = await runNavStress({
		...demo,
		...smoke,
		...(process.argv.includes('--fire') ? { taps: 'fire' as const } : undefined),
		routes: ['/', '/pickups', '/settings', '/pickups/P-1', '/pickups/P-2'],
	});
	for (const { seed, rounds, stuck, earlyOffer } of runs) {
		console.log(
			`seed ${seed}: ${rounds} rounds, ${stuck[0] ? `STUCK ${stuck[0].problems.join('; ')} (${stuck[0].shot})` : 'ok'}, early offer ${earlyOffer ?? 'n/a'}`,
		);
	}
	// The demo has a slow root beforeLoad and a pendingComponent everywhere: the early skeleton must have run (an app without that setup would not assert it).
	code = runs.every((r) => r.stuck.length === 0 && r.earlyOffer === 'ok') ? 0 : 1;
} catch (cause) {
	console.error(cause instanceof Error ? cause.message : cause);
	code = cause instanceof QaSetupError ? 2 : 3;
} finally {
	await server.close();
}
process.exit(code);
