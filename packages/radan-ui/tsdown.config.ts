import { defineConfig } from 'tsdown';

import { entries } from './scripts/components.ts';
import lintPlugin from './tsdown.lint.config.ts';

const base = { format: 'esm', dts: true, clean: false, fixedExtension: false } as const;

export default defineConfig([
	{ entry: ['src/index.ts', 'src/cli.ts'], ...base },
	// One build per platform (cross-platform spec, decision 7): `./button` resolves to dist/web or dist/native through the
	// `./*` pattern in package.json. Every src/components/<name>/ is picked up here; nothing to register.
	{ entry: entries('web'), ...base },
	{ entry: entries('native'), ...base },
	lintPlugin,
]);
