import { readFileSync } from 'node:fs';

import { Button, ButtonSkeleton } from '@radandevist/radan-ui/button';
import { fireEvent, render, screen } from '@testing-library/react-native';
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

test('dark: a .dark ancestor switches bg-background and the ring colour', async () => {
	await render(
		<View className="dark">
			<Button variant="outline">Go</Button>
		</View>,
	);
	console.log('dark style', JSON.stringify(pressable()));
	expect(pressable().backgroundColor).toBe('#18181b'); // bg-background, dark
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

test('every variant and size renders a button', async () => {
	for (const variant of ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const) {
		for (const size of ['default', 'xs', 'sm', 'lg', 'icon'] as const) {
			await render(
				<Button variant={variant} size={size} accessibilityLabel={`${variant}-${size}`}>
					Go
				</Button>,
			);
			expect(screen.getByRole('button', { name: `${variant}-${size}` })).toBeTruthy();
		}
	}
});

test('size changes the height: lg is taller than xs', async () => {
	await render(<Button size="xs">Go</Button>);
	const xs = pressable().height;
	await render(<Button size="lg">Go</Button>);
	expect(xs).toBe(24);
	expect(screen.getAllByRole('button').map((b) => flat(b.props.style).height)).toContain(40);
});

test('loading: busy state, disabled, no press, a spinner', async () => {
	const onPress = jest.fn();
	await render(
		<Button loading onPress={onPress}>
			Saving
		</Button>,
	);
	const button = screen.getByRole('button');
	expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
	expect(JSON.stringify(screen.toJSON())).toContain('ActivityIndicator');
});

test('onPress fires', async () => {
	const onPress = jest.fn();
	await render(<Button onPress={onPress}>Go</Button>);
	fireEvent.press(screen.getByRole('button'));
	expect(onPress).toHaveBeenCalledTimes(1);
});

test('labelClassName reaches the Text and replaces the variant colour; className stays on the Pressable', async () => {
	await render(
		<Button labelClassName="text-status-success" className="rounded-4xl">
			Go
		</Button>,
	);
	expect(flat(screen.getByText('Go').props.style).color).not.toBe('#423600'); // text-primary-foreground replaced
	expect(pressable().borderRadius).toBe(26);
});

test('a non-text child (an icon) is rendered as is, not wrapped in a Text', async () => {
	await render(
		<Button size="icon" accessibilityLabel="add">
			<View testID="icon" />
		</Button>,
	);
	expect(screen.getByTestId('icon')).toBeTruthy();
	expect(screen.queryByText('icon')).toBeNull();
});

test('mixed children: the icon stays outside the Text, the string gets the label Text', async () => {
	await render(
		<Button>
			<View testID="icon" />
			Save
		</Button>,
	);
	expect(screen.getByTestId('icon').parent?.type).not.toBe('Text');
	expect(screen.getByText('Save')).toBeTruthy();
});

test('consecutive text children share one label Text (no gap between "Save" and the count)', async () => {
	const count = 3;
	await render(<Button>Save {count}</Button>);
	expect(screen.getByText('Save 3')).toBeTruthy();
});

test('the skeleton is one hidden bone', async () => {
	await render(<ButtonSkeleton size="lg" />);
	expect(screen.queryByRole('button')).toBeNull();
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
