import { expect, test } from 'vitest';

import { generateThemeCss } from '../src/theme/generate';
import { palette, semantic } from '../src/theme/tokens';

test('default prefix: every library variable is --radan-ui-*', () => {
	const css = generateThemeCss();
	expect(css).toContain('--radan-ui-yellow: #fecd00;');
	expect(css).toContain('--radan-ui-primary: var(--radan-ui-yellow);');
	expect(css).toContain('--radan-ui-card-radius: 14px;');
	// Every declared variable outside @theme carries the prefix.
	const outsideTheme = css.split('@theme inline')[0]!;
	for (const [, name = ''] of outsideTheme.matchAll(/^\s*--([\w-]+):/gm)) {
		expect(name.startsWith('radan-ui-')).toBe(true);
	}
});

test('custom prefix replaces it everywhere, {p} included', () => {
	const css = generateThemeCss({ prefix: 'acme' });
	expect(css).not.toContain('radan-ui');
	expect(css).not.toContain('{p}');
	expect(css).toContain('--acme-effect-raised-control: 0 0 0 1px var(--acme-border);');
});

test('dark values live under .dark, light under :root', () => {
	const css = generateThemeCss();
	const root = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'));
	const dark = css.slice(css.indexOf('.dark {'), css.indexOf('@theme inline'));
	expect(root).toContain('--radan-ui-background: #f7f7f7;');
	expect(dark).toContain('--radan-ui-background: var(--radan-ui-ink);');
	expect(dark).toContain('color-scheme: dark;');
});

test('@theme inline maps Tailwind names to the prefixed tokens', () => {
	const css = generateThemeCss({ prefix: 'x' });
	expect(css).toContain('--color-primary: var(--x-primary);');
	expect(css).toContain('--radius-lg: var(--x-radius);');
	expect(css).toContain('--radius-card: var(--x-card-radius);');
	expect(css).toContain('--shadow-raised-control: var(--x-effect-raised-control);');
});

test('a bad prefix is refused', () => {
	expect(() => generateThemeCss({ prefix: '9x' })).toThrow(/prefix/);
	expect(() => generateThemeCss({ prefix: 'a b' })).toThrow(/prefix/);
});

test('every palette reference exists', () => {
	const refs = [semantic.light, semantic.dark].flatMap((mode) =>
		Object.values(mode).filter((v): v is { palette: keyof typeof palette } => typeof v === 'object' && 'palette' in v),
	);
	for (const ref of refs) {
		expect(Object.keys(palette)).toContain(ref.palette);
	}
});

test('no variable is declared twice in a block nor points at itself (0.1.1 card-foreground cycle)', () => {
	const css = generateThemeCss();
	for (const block of [
		css.slice(css.indexOf(':root {'), css.indexOf('.dark {')),
		css.slice(css.indexOf('.dark {'), css.indexOf('@theme inline')),
	]) {
		const names = [...block.matchAll(/^\s*--([\w-]+):\s*(.+);$/gm)].map(([, name = '', value = '']) => {
			expect(value).not.toContain(`var(--${name})`);
			return name;
		});
		expect(new Set(names).size).toBe(names.length);
	}
});

test('input is the shadcn outline; input-border is a component alias; input-foreground is bridged (issue #17)', () => {
	const css = generateThemeCss();
	expect(css).toContain('--radan-ui-input-border: var(--radan-ui-input);');
	expect(css).toContain('--color-input-foreground: var(--radan-ui-input-foreground);');
	const dark = css.slice(css.indexOf('.dark {'), css.indexOf('@theme inline'));
	const light = css.slice(0, css.indexOf('.dark {'));
	expect(light).toContain('--radan-ui-input: #e4e4e7;');
	expect(light).toContain('--radan-ui-input-foreground: #414141;');
	expect(dark).toContain('--radan-ui-input: #27272a;');
	expect(dark).toContain('--radan-ui-input-foreground: #808697;');
});

test('web output keeps .dark and never follows the OS theme', () => {
	const css = generateThemeCss();
	expect(css).toContain('.dark {');
	expect(css).not.toContain('prefers-color-scheme');
});

test('native output adds the system dark media block with the same dark values, on top of .dark', () => {
	const web = generateThemeCss();
	const css = generateThemeCss({ native: true });
	expect(css).toContain('.dark {');
	const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf('@theme inline'));
	expect(media).toContain(':root {');
	expect(media).toContain('--radan-ui-background: var(--radan-ui-ink);');
	expect(media).not.toContain('color-scheme: dark;');
	// Same output otherwise: stripping the media block gives the web file back.
	expect(css.replace(media, '')).toBe(web);
});

test('no output ever contains :root.dark (a hard compile error on native)', () => {
	for (const native of [false, true]) {
		expect(generateThemeCss({ native })).not.toMatch(/:root\s*\.dark|\.dark\s*:root/);
	}
});
