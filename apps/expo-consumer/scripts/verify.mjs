import assert from 'node:assert/strict';
// Headless proof of the native spike, run from the fixture root after installing the packed tarball:
//   node scripts/verify.mjs   (see ../README.md / scripts/spike-native.sh)
// Metro bundles per platform and checks which build of the Button ended up in it; Vite and tsc resolve the same import.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const run = (cmd, args) =>
	execFileSync(cmd, args, {
		cwd: root,
		encoding: 'utf8',
		maxBuffer: 256 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
const out = mkdtempSync(join(tmpdir(), 'expo-export-'));

// 1. Metro: native Button in the bundle (Pressable from react-native-css via the resolver, native-only class), no web Button.
for (const platform of ['android', 'ios']) {
	const dir = join(out, platform);
	run('npx', ['expo', 'export', '--platform', platform, '--no-bytecode', '--no-minify', '--output-dir', dir]);
	const jsDir = join(dir, '_expo/static/js', platform);
	const bundle = readFileSync(join(jsDir, readdirSync(jsDir)[0]), 'utf8');
	assert(bundle.includes('"active:opacity-80"'), `${platform}: native button.js missing`);
	assert(bundle.includes('accessibilityRole: "button"'), `${platform}: native button.js accessibilityRole missing`);
	assert(!bundle.includes('focus-visible:ring-2'), `${platform}: web button.js leaked into the native bundle`);
	assert(
		/Pressable = \(0, _copyComponentProperties\w*\.copyComponentProperties\)\(_reactNative\.Pressable, props => \{\s*return \(0, _reactNativeCss\.useCssElement\)/.test(
			bundle,
		),
		`${platform}: react-native-css Pressable (className interop) missing`,
	);
	for (const cls of ['bg-primary', 'rounded-control', 'rounded-card', 'shadow-raised-control', 'bg-secondary']) {
		assert(bundle.includes(`["${cls}", [{`), `${platform}: no compiled style for ${cls}`);
	}
	console.log(`ok metro ${platform}`);
}

// 2. Vite (never asserts the react-native condition) resolves ./button to dist/web.
const { build } = createRequire(resolve(root, '../catalog/package.json'))('vite');
const result = await build({
	root,
	logLevel: 'silent',
	configFile: false,
	build: { write: false, lib: { entry: 'web-entry.js', formats: ['es'] }, minify: false },
});
const code = result
	.flatMap((r) => r.output)
	.map((o) => o.code ?? '')
	.join('\n');
assert(
	code.includes('focus-visible:ring-2') && !code.includes('active:opacity-80'),
	'vite did not pick dist/web/button.js',
);
console.log('ok vite');

// 3. tsc: customConditions react-native -> native types; without it -> web types.
const files = (extra) =>
	run('npx', ['tsc', '--noEmit', '--explainFiles', ...extra])
		.split('\n')
		.filter((l) => /^node_modules\/@radandevist\/radan-ui\/dist\/.*\.d\.ts$/.test(l));
assert.deepEqual(files([]), ['node_modules/@radandevist/radan-ui/dist/native/button.d.ts']);
const web = run('npx', ['tsc', '--noEmit', '--explainFiles', '--customConditions', 'default']).split('\n');
assert(
	web.some((l) => l === 'node_modules/@radandevist/radan-ui/dist/web/button.d.ts'),
	'tsc without react-native condition did not pick web types',
);
const trace = run('npx', ['tsc', '--noEmit', '--traceResolution']);
assert(/Matched 'exports' condition 'react-native'/.test(trace), 'traceResolution: react-native condition not matched');
assert(
	trace.includes("Using 'exports' subpath './*' with target './dist/native/button.d.ts'"),
	'traceResolution: wrong target',
);
run('npx', ['tsc', '-p', 'tsconfig.src.json']); // the library's native source typechecks against React Native's types
console.log('ok tsc');

// 4. System dark: react-native-css compiles theme.native.css with the dark media condition on the dark values.
const { default: tailwind } = await import('@tailwindcss/postcss');
const { default: postcss } = await import('postcss');
const { compile } = await import('react-native-css/compiler');
const sheetOf = async (file) => {
	const from = resolve(root, 'node_modules/@radandevist/radan-ui/dist', file);
	const { css } = await postcss([tailwind()]).process(readFileSync(from, 'utf8'), { from });
	return JSON.stringify(
		compile(css, { filename: file, projectRoot: root, inlineVariables: false, inlineRem: 16 }).stylesheet(),
	);
};
const dark = '[["=","prefers-color-scheme","dark"]]';
const nativeSheet = await sheetOf('theme.native.css');
assert(
	nativeSheet.includes(`["radan-ui-background",[[[{},"var","radan-ui-ink",1],${dark}]`),
	'theme.native.css: no dark media',
);
assert(!(await sheetOf('theme.css')).includes('prefers-color-scheme'), 'theme.css must not follow the OS theme');
console.log('ok system dark');

rmSync(out, { recursive: true, force: true });
