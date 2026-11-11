import { defineConfig } from 'tsdown';

/** The `house` OxLint plugin, bundled to plain JS (consumers cannot load `.ts` from `node_modules`). */
export default defineConfig({
	entry: { index: 'lint/plugins/house/index.ts' },
	outDir: 'lint/plugins/house',
	format: 'esm',
	dts: false,
	clean: false,
	fixedExtension: false,
});
