import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };
import {
	componentsDir,
	entries,
	entryFile,
	headless,
	listComponents,
	noSkeleton,
	root,
	webOnly,
} from '../scripts/components';

/**
 * The guards of the cross-platform spec (decisions 1, 3, 6, 8). They walk src/components/*, so a new component is
 * checked without anyone registering it. Each test collects problems as strings and expects none: the failure
 * message names the file to fix.
 */
const names = listComponents();
const webOnlyList = webOnly();
const headlessList = headless();
const noSkeletonList = noSkeleton();
// A headless folder (a router adapter) exports no component: no contract, variants, skeleton, catalog page or native side.
const isHeadless = (name: string) => name in headlessList;
// A terminal state has no loading shape: its folder is exempt from the two skeleton files (no-skeleton.json).
const isNoSkeleton = (name: string) => name in noSkeletonList;
const componentNames = names.filter((name) => !isHeadless(name));
const files = (name: string) => readdirSync(join(componentsDir, name));
const read = (name: string, file: string) => readFileSync(join(componentsDir, name, file), 'utf8');
const isTest = (file: string) => /\.test\.tsx?$/.test(file);

// A comment may name a forbidden thing ("no hover: here"); only code counts.
const code = (source: string) => source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');
// `from 'x'`, side-effect `import 'x'`, and `require('x')` / `import('x')`.
const imports = (source: string) =>
	[...code(source).matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]([^'"]+)['"]/g)].map((match) => match[1]!);
// `fetch(`, `window.fetch(`, `globalThis.fetch(` and `self.fetch(` all call the network; a method on another object is app-side.
const callsFetch = /(?:(?<!\.)\bfetch|(?:window|globalThis|self)\.fetch)\s*\(/;

// The bone family (`bone`, `bone-line`, …) is the one skeleton library: a bone has no skeleton of its own, its catalog
// page and its tests are the `bone` ones.
const isBone = (name: string) => name === 'bone' || name.startsWith('bone-');

const conformance = (name: string) => {
	const have = files(name);
	const missing = (list: string[]) =>
		list.filter((file) => !have.includes(file)).map((file) => `${name}: missing ${file}`);
	const web = [
		`${name}.contract.ts`,
		`${name}.variants.ts`,
		`${name}.web.tsx`,
		...(isBone(name) || isNoSkeleton(name) ? [] : [`${name}.skeleton.web.tsx`]),
	];
	const native = [`${name}.native.tsx`, ...(isBone(name) || isNoSkeleton(name) ? [] : [`${name}.skeleton.native.tsx`])];
	const listed = webOnlyList[name];
	if (!listed) {
		return [...missing(web), ...missing(native).map((message) => `${message} (or list ${name} in web-only.json)`)];
	}
	return [
		...missing(web),
		...(listed.reason ? [] : [`${name}: web-only.json needs a reason`]),
		...(listed.issue.startsWith('https://github.com/') ? [] : [`${name}: web-only.json needs an issue URL`]),
		...native.filter((file) => have.includes(file)).map((file) => `${name}: has ${file}, remove it from web-only.json`),
	];
};

describe('conformance (decision 8)', () => {
	test.each(componentNames)(
		'%s has the contract, variants and both platforms, or is listed in web-only.json',
		(name) => {
			expect(conformance(name)).toEqual([]);
		},
	);

	test('web-only.json lists only existing components', () => {
		expect(Object.keys(webOnlyList).filter((name) => !names.includes(name))).toEqual([]);
	});

	test('headless.json lists only existing folders, each with a reason, an issue, a web entry and a test', () => {
		const problems = Object.entries(headlessList).flatMap(([name, listed]) => [
			...(names.includes(name) ? [] : [`${name}: no such folder`]),
			...(listed.reason ? [] : [`${name}: headless.json needs a reason`]),
			...(listed.issue.startsWith('https://github.com/') ? [] : [`${name}: headless.json needs an issue URL`]),
			...(names.includes(name) && !files(name).includes(`${name}.web.tsx`) ? [`${name}: missing ${name}.web.tsx`] : []),
			...(names.includes(name) && !files(name).some((file) => isTest(file)) ? [`${name}: no test beside it`] : []),
			...(webOnlyList[name] ? [`${name}: listed in both headless.json and web-only.json`] : []),
			...(names.includes(name) && files(name).some((file) => /\.native\.tsx?$/.test(file))
				? [`${name}: a headless folder has no native file`]
				: []),
		]);
		expect(problems).toEqual([]);
	});

	test('no-skeleton.json lists only existing components, each with a reason, an issue, a web entry and a test', () => {
		const problems = Object.entries(noSkeletonList).flatMap(([name, listed]) => [
			...(names.includes(name) ? [] : [`${name}: no such folder`]),
			...(listed.reason ? [] : [`${name}: no-skeleton.json needs a reason`]),
			...(listed.issue.startsWith('https://github.com/') ? [] : [`${name}: no-skeleton.json needs an issue URL`]),
			...(names.includes(name) && !files(name).includes(`${name}.web.tsx`) ? [`${name}: missing ${name}.web.tsx`] : []),
			...(names.includes(name) && !files(name).some((file) => isTest(file)) ? [`${name}: no test beside it`] : []),
			...(headlessList[name] ? [`${name}: listed in both no-skeleton.json and headless.json`] : []),
		]);
		expect(problems).toEqual([]);
	});

	test.each(componentNames.filter((name) => !isBone(name) || name === 'bone'))(
		'%s has a catalog page and a test',
		(name) => {
			const page = `apps/catalog/pages/${name}.page.tsx`;
			const problems = [
				...(existsSync(join(root, '../..', page)) ? [] : [`missing ${page}`]),
				...(files(name).some((file) => isTest(file)) ? [] : [`${name}: no *.test.tsx beside the component`]),
			];
			expect(problems).toEqual([]);
		},
	);
});

describe('export map (decision 1)', () => {
	const pattern = packageJson.exports['./*'];

	test('one `./*` pattern serves every component on both platforms', () => {
		expect(pattern['react-native']).toEqual({ types: './dist/native/*.d.ts', default: './dist/native/*.js' });
		expect(pattern.default).toEqual({ types: './dist/web/*.d.ts', default: './dist/web/*.js' });
	});

	test('every component builds an entry per platform it implements, and every entry has its source', () => {
		const expected = Object.fromEntries([
			...names.map((name) => [`web/${name}`, entryFile(name, 'web')] as const),
			...componentNames
				.filter((name) => !webOnlyList[name])
				.map((name) => [`native/${name}`, entryFile(name, 'native')] as const),
		]);
		expect({ ...entries('web'), ...entries('native') }).toEqual(expected);
		expect(Object.values(expected).filter((source) => !existsSync(join(root, source)))).toEqual([]);
	});
});

describe('platform imports (decision 6)', () => {
	test.each([
		["import { x } from 'nativewind';", 'nativewind'],
		["import 'nativewind';", 'nativewind'],
		["const x = require('react-native');", 'react-native'],
		["const x = await import('@base-ui/react');", '@base-ui/react'],
		["export * from '@rn-primitives/slot';", '@rn-primitives/slot'],
	])('the matcher catches %s', (source, from) => {
		expect(imports(source)).toEqual([from]);
	});

	// Every folder but the router adapter is router-free (spec §4.2): only `page-transition-tanstack-router/` may import `@tanstack/*`.
	test.each(names.filter((name) => name !== 'page-transition-tanstack-router'))(
		'%s imports no @tanstack/* package',
		(name) => {
			const problems = files(name)
				.filter((file) => /\.tsx?$/.test(file))
				.flatMap((file) =>
					imports(read(name, file))
						.filter((from) => from.startsWith('@tanstack/'))
						.map((from) => `${name}/${file} imports ${from}`),
				);
			expect(problems).toEqual([]);
		},
	);

	// `app-state` is pure presentation: no router, no i18n, no fetch and no browser effect (spec §5.4, §6.5).
	test('app-state imports no router or i18n and calls no fetch', () => {
		const problems = files('app-state')
			.filter((file) => /\.tsx?$/.test(file) && !isTest(file))
			.flatMap((file) => {
				const source = code(read('app-state', file));
				return [
					...imports(source)
						.filter((from) => from.startsWith('@tanstack/') || /^(i18next|react-i18next)$/.test(from))
						.map((from) => `app-state/${file} imports ${from}`),
					...(callsFetch.test(source) ? [`app-state/${file} calls fetch`] : []),
				];
			});
		expect(problems).toEqual([]);
	});

	test.each(['fetch(url)', 'window.fetch(url)', 'globalThis.fetch(url)', 'self.fetch(url)'])(
		'the fetch guard catches %s',
		(source) => {
			expect(callsFetch.test(source)).toBe(true);
		},
	);

	test.each(['refetch()', 'cache.fetch(url)'])('the fetch guard ignores %s', (source) => {
		expect(callsFetch.test(source)).toBe(false);
	});

	// The router's private shape (`_tx`, `stores`) is read in ONE file of the adapter, with runtime shape checks (spec §7.1).
	test("only the adapter's internals.ts reads the router's private `_tx` / `stores`", () => {
		const adapter = 'page-transition-tanstack-router';
		const problems = files(adapter)
			.filter((file) => /\.tsx?$/.test(file) && !isTest(file) && file !== `${adapter}.internals.ts`)
			.filter((file) => /\b_tx\b|\.stores\b|\bstores\./.test(code(read(adapter, file))))
			.map((file) => `${adapter}/${file} reads the router's private state: move it to ${adapter}.internals.ts`);
		expect(problems).toEqual([]);
	});

	const native = /^(react-native|nativewind|@rn-primitives\/)/;
	const web = /^(@base-ui\/|react-dom)/;
	// `*.web.tsx` may use Base UI; `*.native.tsx` the native libraries; every other file (contract, variants) neither.
	const forbidden = (file: string) => {
		if (file.endsWith('.web.tsx')) {
			return [native];
		}
		if (file.endsWith('.native.tsx')) {
			return [web];
		}
		return [native, web];
	};

	test.each(names)('%s: web files import no native library, native files no Base UI, shared files neither', (name) => {
		const problems = files(name)
			.filter((file) => /\.tsx?$/.test(file) && !isTest(file))
			.flatMap((file) =>
				imports(read(name, file))
					.filter((from) => forbidden(file).some((re) => re.test(from)))
					.map((from) => `${name}/${file} imports ${from}`),
			);
		expect(problems).toEqual([]);
	});
});

describe('shared variants (decision 3)', () => {
	test.each(componentNames)('%s.variants.ts has no web-only state or color-mix()', (name) => {
		const source = code(read(name, `${name}.variants.ts`));
		expect(source.match(/hover:|focus-visible:|group-hover:|color-mix\(/g) ?? []).toEqual([]);
	});
});

describe('skeletons are owned by their component (issue #66)', () => {
	const skeletonFree = names.filter((name) => !isBone(name));

	test('no root `Skeleton` namespace: no `skeleton` component, no `Skeleton` export that is not a static member', () => {
		expect(names).not.toContain('skeleton');
		const problems = skeletonFree.flatMap((name) =>
			files(name)
				.filter((file) => /\.(web|native)\.tsx$/.test(file) && !isTest(file) && !file.includes('.skeleton.'))
				.filter((file) =>
					/export\s+const\s+\w*Skeleton\b|export\s*\{[^}]*Skeleton\b[^}]*\}/.test(code(read(name, file))),
				)
				.map((file) => `${name}/${file} exports a skeleton at top level: make it \`<Component>.Skeleton\``),
		);
		expect(problems).toEqual([]);
	});

	test('a component with a skeleton file exposes it as `.Skeleton` (web)', () => {
		const problems = skeletonFree
			.filter((name) => files(name).includes(`${name}.skeleton.web.tsx`))
			.filter((name) => !/Skeleton:\s*\w+Skeleton/.test(read(name, `${name}.web.tsx`)))
			.map((name) => `${name}.web.tsx has a skeleton file but no \`Skeleton: …\` static member`);
		expect(problems).toEqual([]);
	});
});
