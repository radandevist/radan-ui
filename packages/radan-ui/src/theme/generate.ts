import { DEFAULT_PREFIX } from '../index';
import { component, palette, semantic, tailwindColors, type TokenValue } from './tokens';

const PREFIX = /^[a-z][a-z0-9-]*$/;

const value = (v: TokenValue, p: string) => {
	if (typeof v === 'string') {
		return v.replaceAll('{p}', p);
	}
	return 'palette' in v ? `var(--${p}-${v.palette})` : `var(--${p}-${v.semantic})`;
};

const block = (selector: string, entries: [string, TokenValue][], p: string, extra: string[] = []) =>
	[`${selector} {`, ...extra, ...entries.map(([k, v]) => `\t--${p}-${k}: ${value(v, p)};`), '}'].join('\n');

/**
 * The theme as a Tailwind v4 CSS file: the palette and light/component tokens on `:root`, the dark ones on `.dark`,
 * and `@theme inline` mapping Tailwind's names (`bg-primary`, `rounded-card`…) to the prefixed variables.
 * `native: true` also emits `@media (prefers-color-scheme: dark) { :root { … } }` so NativeWind follows the system
 * theme. It is a separate output because on the web that block would turn every light-only app dark under a dark OS.
 * Never emit `:root.dark`: react-native-css rejects it.
 */
export const generateThemeCss = ({
	prefix = DEFAULT_PREFIX,
	native = false,
}: { prefix?: string; native?: boolean } = {}) => {
	if (!PREFIX.test(prefix)) {
		throw new Error(`invalid prefix "${prefix}": expected ${PREFIX.source}`);
	}
	const p = prefix;
	const radius = (n: number) => `calc(var(--${p}-radius) * ${n})`;
	const theme = [
		'@theme inline {',
		...tailwindColors.map((c) => `\t--color-${c}: var(--${p}-${c});`),
		`\t--radius-sm: ${radius(0.6)};`,
		`\t--radius-md: ${radius(0.8)};`,
		`\t--radius-lg: var(--${p}-radius);`,
		`\t--radius-xl: ${radius(1.4)};`,
		`\t--radius-2xl: ${radius(1.8)};`,
		`\t--radius-3xl: ${radius(2.2)};`,
		`\t--radius-4xl: ${radius(2.6)};`,
		`\t--radius-card: var(--${p}-card-radius);`,
		`\t--radius-control: var(--${p}-control-radius);`,
		`\t--radius-popover: var(--${p}-popover-radius);`,
		`\t--radius-toast: var(--${p}-toast-radius);`,
		`\t--shadow-raised-control: var(--${p}-effect-raised-control);`,
		`\t--shadow-primary-raised: var(--${p}-effect-primary-raised);`,
		`\t--shadow-popover: var(--${p}-effect-popover);`,
		'}',
	].join('\n');
	return [
		`/* Generated theme — prefix "${p}". Override any variable after this import. */`,
		block(':root', [...Object.entries(palette), ...Object.entries(semantic.light), ...Object.entries(component)], p, [
			'\tcolor-scheme: light;',
		]),
		block('.dark', Object.entries(semantic.dark), p, ['\tcolor-scheme: dark;']),
		...(native
			? [
					`@media (prefers-color-scheme: dark) {\n${block(':root', Object.entries(semantic.dark), p).replace(/^/gm, '\t')}\n}`,
				]
			: []),
		theme,
		'',
	].join('\n\n');
};
