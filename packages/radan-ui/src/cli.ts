#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { generateThemeCss } from './theme/generate';

const USAGE = 'usage: radan-ui theme [--prefix <prefix>] [--native]';
const { positionals, values } = parseArgs({
	allowPositionals: true,
	options: { prefix: { type: 'string' }, native: { type: 'boolean' } },
});
if (positionals[0] !== 'theme') {
	process.stderr.write(`${USAGE}\n`);
	process.exit(1);
}
process.stdout.write(generateThemeCss({ prefix: values.prefix, native: values.native }));
