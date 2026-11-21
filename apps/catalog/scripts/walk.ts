import { readFileSync, writeFileSync } from 'node:fs';

import { runTransitionWalk, QaSetupError } from '@radandevist/radan-ui/qa';

import { demo, serveDemo } from './demo.ts';
import { steps } from './walk-steps.ts';

// `node scripts/walk.ts --check`: the walk equals the checked-in records (CI); `--update`: rewrite them (a deliberate
// behaviour change, reviewed in the diff); no flag: print the records. Exit 0 identical, 1 differs, 2 not runnable.
const expectedFile = new URL('./walk.expected.json', import.meta.url);
const server = await serveDemo();
let code = 0;
try {
	const json = `${JSON.stringify(await runTransitionWalk({ ...demo, steps }), null, '\t')}\n`;
	if (process.argv.includes('--update')) {
		writeFileSync(expectedFile, json);
	} else if (process.argv.includes('--check')) {
		const same = json === readFileSync(expectedFile, 'utf8');
		console.log(same ? 'walk: identical to walk.expected.json' : `walk: DIFFERS from walk.expected.json\n${json}`);
		code = same ? 0 : 1;
	} else {
		console.log(json);
	}
} catch (cause) {
	console.error(cause instanceof Error ? cause.message : cause);
	code = cause instanceof QaSetupError ? 2 : 3;
} finally {
	await server.close();
}
process.exit(code);
