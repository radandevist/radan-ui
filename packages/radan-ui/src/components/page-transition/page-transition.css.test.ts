import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const raw = readFileSync(join(__dirname, 'page-transition.css'), 'utf8');
const css = raw.replaceAll(/\/\*[\s\S]*?\*\//g, '');
const tokens = new Map([...css.matchAll(/(--radan-ui-page-[a-z-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
/** The stylesheet with every token replaced by its default: what the literals were before the token layer. */
const literal = css.replaceAll(
	/var\((--radan-ui-page-[a-z-]+)\)/g,
	(_, name: string) => tokens.get(name) ?? `MISSING(${name})`,
);
const rule = (style: string, direction: string, side: 'old' | 'new') =>
	literal.match(
		new RegExp(
			`html\\[data-page-transition='${style}'\\]\\[data-page-direction='${direction}'\\]::view-transition-${side}\\(root\\)\\s*\\{([^}]*)\\}`,
		),
	)?.[1];

describe('page-transition.css', () => {
	it('has every style x direction both pseudo-elements, except iOS fade (instant)', () => {
		for (const style of ['ios', 'material']) {
			for (const direction of ['push', 'back', 'fade']) {
				for (const side of ['old', 'new'] as const) {
					const found = rule(style, direction, side);
					expect(found === undefined, `${style} ${direction} ${side}`).toBe(style === 'ios' && direction === 'fade');
				}
			}
		}
	});

	it('has no media query: reduced motion, md, style none and a missing API never start a transition', () => {
		expect(css).not.toContain('@media');
	});

	it('has every page token defined, and none left undefined in a var()', () => {
		expect([...tokens.keys()].sort()).toEqual([
			'--radan-ui-page-fade-in',
			'--radan-ui-page-fade-out',
			'--radan-ui-page-ios-duration',
			'--radan-ui-page-ios-ease',
			'--radan-ui-page-material-duration',
			'--radan-ui-page-material-ease-in',
			'--radan-ui-page-material-ease-out',
		]);
		expect(literal).not.toContain('MISSING');
	});

	it('plays, with the token defaults, the exact literals ShopKartOS ships', () => {
		const IOS = '350ms cubic-bezier(0.32, 0.72, 0, 1)';
		const OUT = '300ms cubic-bezier(0.3, 0, 0.8, 0.15)';
		const IN = '300ms cubic-bezier(0.05, 0.7, 0.1, 1)';
		const squash = (value: string | undefined) => value?.replaceAll(/\s+/g, ' ').trim();
		expect(squash(rule('ios', 'push', 'old'))).toBe(`animation: nav-under-out ${IOS} both;`);
		expect(squash(rule('ios', 'push', 'new'))).toBe(`z-index: 2; animation: nav-cover-in ${IOS} both;`);
		expect(squash(rule('ios', 'back', 'old'))).toBe(`z-index: 2; animation: nav-cover-out ${IOS} both;`);
		expect(squash(rule('ios', 'back', 'new'))).toBe(`animation: nav-under-in ${IOS} both;`);
		expect(squash(rule('material', 'push', 'old'))).toBe(
			`animation: nav-x-left ${OUT} both, nav-fade-out 90ms linear both;`,
		);
		expect(squash(rule('material', 'push', 'new'))).toBe(
			`animation: nav-x-from-right ${IN} both, nav-fade-in 210ms linear 90ms both;`,
		);
		expect(squash(rule('material', 'back', 'old'))).toBe(
			`animation: nav-x-right ${OUT} both, nav-fade-out 90ms linear both;`,
		);
		expect(squash(rule('material', 'back', 'new'))).toBe(
			`animation: nav-x-from-left ${IN} both, nav-fade-in 210ms linear 90ms both;`,
		);
		expect(squash(rule('material', 'fade', 'old'))).toBe('animation: nav-fade-out 90ms linear both;');
		expect(squash(rule('material', 'fade', 'new'))).toBe(
			'animation: nav-fade-in 210ms cubic-bezier(0.05, 0.7, 0.1, 1) 90ms both, nav-scale-in 210ms cubic-bezier(0.05, 0.7, 0.1, 1) 90ms both;',
		);
	});
});
