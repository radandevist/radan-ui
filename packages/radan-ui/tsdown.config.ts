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
	// One build per platform (cross-platform spec, decision 7): `./button` resolves to dist/web or dist/native.
	{
		entry: { 'web/button': 'src/components/button/button.web.tsx' },
		format: 'esm',
		dts: true,
		clean: false,
		fixedExtension: false,
	},
	{
		entry: { 'native/button': 'src/components/button/button.native.tsx' },
		format: 'esm',
		dts: true,
		clean: false,
		fixedExtension: false,
	},
	lintPlugin,
]);
