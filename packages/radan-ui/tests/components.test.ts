import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };
import { componentsDir, entries, entryFile, listComponents, root, webOnly } from '../scripts/components';

/**
 * The guards of the cross-platform spec (decisions 1, 3, 6, 8). They walk src/components/*, so a new component is
 * checked without anyone registering it. Each test collects problems as strings and expects none: the failure
 * message names the file to fix.
 */
const names = listComponents();
const webOnlyList = webOnly();
const files = (name: string) => readdirSync(join(componentsDir, name));
const read = (name: string, file: string) => readFileSync(join(componentsDir, name, file), 'utf8');
const isTest = (file: string) => /\.test\.tsx?$/.test(file);

// A comment may name a forbidden thing ("no hover: here"); only code counts.
const code = (source: string) => source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/^\s*\/\/.*$/gm, '');
const imports = (source: string) =>
	[...code(source).matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g)].map((match) => match[1]!);

const conformance = (name: string) => {
	const have = files(name);
	const missing = (list: string[]) =>
		list.filter((file) => !have.includes(file)).map((file) => `${name}: missing ${file}`);
	const web = [`${name}.contract.ts`, `${name}.variants.ts`, `${name}.web.tsx`, `${name}.skeleton.web.tsx`];
	const native = [`${name}.native.tsx`, `${name}.skeleton.native.tsx`];
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
	test.each(names)('%s has the contract, variants and both platforms, or is listed in web-only.json', (name) => {
		expect(conformance(name)).toEqual([]);
	});

	test('web-only.json lists only existing components', () => {
		expect(Object.keys(webOnlyList).filter((name) => !names.includes(name))).toEqual([]);
	});

	test.each(names)('%s has a catalog page and a test', (name) => {
		const page = `apps/catalog/pages/${name}.page.tsx`;
		const problems = [
			...(existsSync(join(root, '../..', page)) ? [] : [`missing ${page}`]),
			...(files(name).some((file) => isTest(file)) ? [] : [`${name}: no *.test.tsx beside the component`]),
		];
		expect(problems).toEqual([]);
	});
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
			...names
				.filter((name) => !webOnlyList[name])
				.map((name) => [`native/${name}`, entryFile(name, 'native')] as const),
		]);
		expect({ ...entries('web'), ...entries('native') }).toEqual(expected);
		expect(Object.values(expected).filter((source) => !existsSync(join(root, source)))).toEqual([]);
	});
});

describe('platform imports (decision 6)', () => {
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
	test.each(names)('%s.variants.ts has no web-only state or color-mix()', (name) => {
		const source = code(read(name, `${name}.variants.ts`));
		expect(source.match(/hover:|focus-visible:|group-hover:|color-mix\(/g) ?? []).toEqual([]);
	});
});
