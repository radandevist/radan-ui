import { defineConfig } from 'tsdown';

/** The `house` and `anti-slop` OxLint plugins, bundled to plain JS (consumers cannot load `.ts` from `node_modules`). */
export default defineConfig({
	entry: {
		'house/index': 'lint/plugins/house/index.ts',
		'anti-slop/index': 'lint/plugins/anti-slop/index.ts',
	},
	outDir: 'lint/plugins',
	format: 'esm',
	dts: false,
	clean: false,
	fixedExtension: false,
});
