import { expect, test } from 'vitest';

import { palette, semantic, type TokenValue } from '../src/theme/tokens';

/** A semantic value as a hex colour: a palette reference resolved, `#fff` expanded. */
const hex = (v: TokenValue | undefined, token: string): string => {
	const raw = typeof v === 'object' && 'palette' in v ? palette[v.palette] : v;
	const m = typeof raw === 'string' ? /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw) : null;
	if (!m?.[1]) {
		throw new Error(`contrast test: token "${token}" is not a resolvable hex colour (got ${JSON.stringify(v)})`);
	}
	const h = m[1];
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

const AA = 4.5; // WCAG 1.4.3, normal text
const UI = 3; // WCAG 1.4.11, non-text (focus indicator)

// [text/graphic token, surface tokens it is drawn on, minimum ratio] — real pairs only, both themes.
// Not tested: `border` (decorative dividers). `input` (the field outline, 1.18:1): WCAG 1.4.11 would ask 3:1
// when the outline is the field's only boundary, but the owner kept the pale outline as the library default (decision
// 2026-11-11, issue #17).
const PAIRS: [string, string[], number][] = [
	['sidebar-ring', ['sidebar'], UI],
	['foreground', ['background', 'card', 'popover', 'muted', 'secondary'], AA],
	['foreground-secondary', ['background', 'card', 'popover', 'muted', 'secondary'], AA],
	['muted-foreground', ['background', 'card', 'popover', 'muted', 'secondary'], AA],
	['card-foreground', ['card'], AA],
	['popover-foreground', ['popover', 'popover-surface'], AA],
	['secondary-foreground', ['secondary'], AA],
	['primary-foreground', ['primary'], AA],
	['accent-foreground', ['accent'], AA],
	['destructive', ['destructive-surface', 'background', 'card'], AA],
	['status-open-foreground', ['status-open-background'], AA],
	['status-pending-foreground', ['status-pending-background'], AA],
	['status-resolved-foreground', ['status-resolved-background'], AA],
	['status-closed-foreground', ['status-closed-background'], AA],
	['status-breached-foreground', ['status-breached-background'], AA],
	['status-success', ['background', 'card', 'popover'], AA],
	['status-warning', ['background', 'card', 'popover'], AA],
	['sidebar-foreground', ['sidebar'], AA],
	['sidebar-accent-foreground', ['sidebar-accent'], AA],
	// `input-foreground` is the field's text colour (DESIGN.md §2), drawn on the page and the surfaces a field sits in.
	['input-foreground', ['background', 'card', 'popover'], AA],
	['ring', ['background', 'card', 'popover'], UI],
];

for (const theme of ['light', 'dark'] as const) {
	for (const [fg, surfaces, min] of PAIRS) {
		for (const surface of surfaces) {
			test(`${theme}: ${fg} on ${surface} >= ${min}:1`, () => {
				const tokens = semantic[theme];
				// primary / accent are inherited by dark: fall back to light.
				const get = (k: string) => hex(tokens[k] ?? semantic.light[k], k);
				expect(contrast(get(fg), get(surface))).toBeGreaterThanOrEqual(min);
			});
		}
	}
}
