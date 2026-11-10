import { expect, test } from 'vitest';

import { palette, semantic, type TokenValue } from '../src/theme/tokens';

/** A semantic value as a hex colour: a palette reference resolved, `#fff` expanded. */
const hex = (v: TokenValue | undefined): string => {
	const raw = typeof v === 'object' && 'palette' in v ? palette[v.palette] : String(v);
	const h = raw.replace('#', '');
	return h.length === 3 ? [...h].map((c) => c + c).join('') : h;
};

const luminance = (h: string) => {
	const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => {
		const c = Number.parseInt(h.slice(i, i + 2), 16) / 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
	return (hi + 0.05) / (lo + 0.05);
};

// WCAG AA for normal text (4.5:1): every text colour on every surface it is drawn on, in both themes.
const TEXT = ['foreground', 'foreground-secondary', 'card-foreground', 'muted-foreground', 'secondary-foreground'];
const SURFACES = ['background', 'card', 'popover', 'muted', 'secondary'];

for (const theme of ['light', 'dark'] as const) {
	for (const text of TEXT) {
		for (const surface of SURFACES) {
			test(`${theme}: ${text} on ${surface} meets WCAG AA (4.5:1)`, () => {
				const tokens = semantic[theme];
				expect(contrast(hex(tokens[text]), hex(tokens[surface]))).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
	test(`${theme}: sidebar-foreground on sidebar meets WCAG AA (4.5:1)`, () => {
		const tokens = semantic[theme];
		expect(contrast(hex(tokens['sidebar-foreground']), hex(tokens.sidebar))).toBeGreaterThanOrEqual(4.5);
	});
}
