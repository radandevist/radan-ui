// The one place that knows the component layout (src/components/<name>/<name>.{web,native}.tsx). tsdown and the
// guards in tests/components.test.ts both read it, so adding a folder is the whole job: no entry list to edit.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('..', import.meta.url));
export const componentsDir = join(root, 'src/components');

export type WebOnly = Record<string, { reason: string; issue: string }>;

/** Components that have no native side yet: `{ "<name>": { "reason": "…", "issue": "https://github.com/…" } }`. */
export const webOnly = (): WebOnly => JSON.parse(readFileSync(join(componentsDir, 'web-only.json'), 'utf8'));

export const listComponents = () =>
	readdirSync(componentsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();

/** The source of a component's entry on one platform. */
export const entryFile = (name: string, platform: 'web' | 'native') => `src/components/${name}/${name}.${platform}.tsx`;

/** tsdown `entry` map for one platform: `{ 'web/button': 'src/components/button/button.web.tsx', … }`. */
export const entries = (platform: 'web' | 'native') =>
	Object.fromEntries(
		listComponents()
			.filter((name) => existsSync(join(root, entryFile(name, platform))))
			.map((name) => [`${platform}/${name}`, entryFile(name, platform)]),
	);
