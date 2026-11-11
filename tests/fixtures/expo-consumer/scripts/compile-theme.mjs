// Manual probe: run global.css through Tailwind (PostCSS) then react-native-css' compiler, print what it drops.
// Usage: node scripts/compile-theme.mjs [css-file] [--no-inline] [--json]
import { readFileSync } from 'node:fs';

import tailwind from '@tailwindcss/postcss';
import postcss from 'postcss';
import { compile } from 'react-native-css/compiler';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--')) ?? 'global.css';
const inlineVariables = args.includes('--no-inline') ? false : undefined;
const { css } = await postcss([tailwind()]).process(readFileSync(file, 'utf8'), { from: file });
const compiled = compile(css, { filename: file, projectRoot: process.cwd(), inlineVariables });
const sheet = JSON.parse(JSON.stringify(compiled.stylesheet()));
console.log(
	args.includes('--json')
		? JSON.stringify({ warnings: compiled.warnings(), sheet }, null, 1)
		: JSON.stringify(compiled.warnings(), null, 1),
);
