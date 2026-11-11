import { readFileSync } from 'node:fs';

import { Button } from '@radandevist/radan-ui/button';
import { render, screen } from '@testing-library/react-native';
import { vars } from 'nativewind';
import { View } from 'react-native';
import { registerCSS } from 'react-native-css/jest';
import { colorScheme } from 'react-native-css/native';

// The real pipeline minus Metro: Tailwind (scanning the installed library) -> react-native-css compiler, same options as metro.config.js.
const css = readFileSync('node_modules/.cache/tailwind-out.css', 'utf8');
// react-native-css/jest clears the style collection before each test.
beforeEach(() => {
	registerCSS(css, { inlineVariables: false, inlineRem: 16 });
});

const flat = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
const pressable = () => flat(screen.getByRole('button').props.style);

test('className on the prebuilt Pressable becomes a style (bg-primary, rounded-control)', async () => {
	await render(<Button>Go</Button>);
	expect(pressable()).toMatchObject({ backgroundColor: '#fecd00', borderRadius: 14 });
});

test('a conflicting className replaces the variant utility (cn/twMerge): rounded-4xl beats rounded-control', async () => {
	await render(<Button className="rounded-4xl bg-card">Go</Button>);
	expect(pressable().borderRadius).toBe(26); // 0.625rem * 2.6 * 16; rounded-control would be 14
	expect(pressable().backgroundColor).toBe('#f2f2f2'); // bg-card, not bg-primary
});

test('outline: shadow-raised-control resolves to a 1px ring in the border colour, light', async () => {
	await render(<Button variant="outline">Go</Button>);
	console.log('light ring', JSON.stringify(pressable().boxShadow));
	expect(JSON.stringify(pressable().boxShadow)).toContain('#e3e3e3');
});

test('dark: a .dark ancestor switches bg-card and the ring colour', async () => {
	await render(
		<View className="dark">
			<Button variant="outline">Go</Button>
		</View>,
	);
	console.log('dark style', JSON.stringify(pressable()));
	expect(pressable().backgroundColor).toBe('#1f1f23');
	expect(JSON.stringify(pressable().boxShadow)).toContain('#323234');
});

test('runtime override of --radan-ui-primary on an ancestor', async () => {
	await render(
		<View style={vars({ '--radan-ui-primary': '#ff0000' })}>
			<Button>Go</Button>
		</View>,
	);
	expect(pressable().backgroundColor).toBe('#ff0000');
});

// Findings that shaped metro.config.js: react-native-css' defaults break the library's contract.
describe('react-native-css defaults (not what the fixture uses)', () => {
	test('default inlineVariables: a single-definition variable is inlined at build time, so the override is ignored', async () => {
		registerCSS(css, { inlineRem: 16 });
		await render(
			<View style={vars({ '--radan-ui-primary': '#ff0000' })}>
				<Button>Go</Button>
			</View>,
		);
		expect(pressable().backgroundColor).toBe('#fecd00');
	});

	test('default rem is 14: radii and spacing come out smaller than on the web', async () => {
		registerCSS(css, { inlineVariables: false });
		await render(<Button>Go</Button>);
		expect(pressable().borderRadius).toBeCloseTo(12.25); // web: 10px * 1.4 = 14
	});
});

test('system dark mode needs @media (prefers-color-scheme: dark), the .dark class is not read from the system', async () => {
	registerCSS(
		':root{--radan-ui-card:#f2f2f2} @media (prefers-color-scheme: dark){:root{--radan-ui-card:#1f1f23}} .bg-card{background-color:var(--radan-ui-card)}',
	);
	colorScheme.set('dark'); // what Appearance's change listener does on a device
	await render(<View testID="v" className="bg-card" />);
	expect(flat(screen.getByTestId('v').props.style).backgroundColor).toBe('#1f1f23');
});

test('opacity modifier (bg-foreground/10, the skeleton token) resolves colour-mix(oklab) of a theme variable at runtime', async () => {
	await render(<View testID="v" className="bg-foreground/10" />);
	console.log('foreground/10', flat(screen.getByTestId('v').props.style).backgroundColor);
	expect(String(flat(screen.getByTestId('v').props.style).backgroundColor)).toMatch(/^(#|rgba?\()/);
});
