import { defineConfig } from 'tsdown';

import lintPlugin from './tsdown.lint.config.ts';

export default defineConfig([
	{
		entry: ['src/index.ts', 'src/cli.ts'],
		format: 'esm',
		dts: true,
		clean: false,
		fixedExtension: false,
	},
	lintPlugin,
]);
