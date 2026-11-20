import { readFileSync } from 'node:fs';

import { BoneLine } from '@radandevist/radan-ui/bone-line';
import { BonePill } from '@radandevist/radan-ui/bone-pill';
import { BoneRegion } from '@radandevist/radan-ui/bone-region';
import { BoneText } from '@radandevist/radan-ui/bone-text';
import { Button } from '@radandevist/radan-ui/button';
import { Card } from '@radandevist/radan-ui/card';
import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { registerCSS } from 'react-native-css/jest';

const css = readFileSync('node_modules/.cache/tailwind-out.css', 'utf8');
beforeEach(() => {
	registerCSS(css, { inlineVariables: false, inlineRem: 16 });
});

const flat = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const card = (
	<Card.Skeleton>
		<Card.Header.Skeleton>
			<BoneLine size="sm" width="w-16" />
			<BonePill width="w-14" />
		</Card.Header.Skeleton>
		<Card.Body.Skeleton>
			<BoneText lines={2} size="xs" />
		</Card.Body.Skeleton>
	</Card.Skeleton>
);

test('the card is a busy region that reads Loading…, on the real card surface', async () => {
	await render(card);
	const region = screen.getByLabelText('Loading…', { hidden: true });
	expect(region.props.accessibilityState).toMatchObject({ busy: true });
	expect(flat(region.props.style)).toMatchObject({ backgroundColor: '#f2f2f2', borderRadius: 14 });
});

test('a nested card adds no second Loading… node', async () => {
	await render(
		<BoneRegion label="Chargement…">
			{card}
			{card}
		</BoneRegion>,
	);
	expect(screen.getAllByLabelText('Chargement…', { hidden: true })).toHaveLength(1);
	expect(screen.queryByLabelText('Loading…', { hidden: true })).toBeNull();
});

const withPlatform = async (os: 'ios' | 'android', label: string) => {
	const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
	const before = Platform.OS;
	Platform.OS = os;
	await render(<Card.Skeleton label={label}>{null}</Card.Skeleton>);
	Platform.OS = before;
	const calls = announce.mock.calls.filter(([text]) => text === label).length;
	announce.mockRestore();
	return calls;
};

test('iOS: a polite live region plus exactly one explicit announcement on mount', async () => {
	expect(await withPlatform('ios', 'Announce ios')).toBe(1);
	expect(screen.getByLabelText('Announce ios', { hidden: true }).props.accessibilityLiveRegion).toBe('polite');
});

test('Android: the live region is present and there is no explicit announcement (no double read)', async () => {
	expect(await withPlatform('android', 'Announce android')).toBe(0);
	expect(screen.getByLabelText('Announce android', { hidden: true }).props.accessibilityLiveRegion).toBe('polite');
});

// The host View carries a resolved `style`, not the className: compare it with a reference View given the token classes.
const pair = async (bone: React.ReactElement, reference: React.ReactElement) => {
	await render(
		<>
			<View testID="bone">{bone}</View>
			<View testID="reference">{reference}</View>
		</>,
	);
	return {
		bone: screen.getByTestId('bone').children[0] as unknown as { props: Record<string, unknown> },
		reference: screen.getByTestId('reference').children[0] as unknown as { props: Record<string, unknown> },
	};
};

test('bones are hidden from assistive tech (both flags) and resolve to the shared token classes', async () => {
	const { bone, reference } = await pair(
		<BoneLine size="sm" width="w-16" />,
		<View className="animate-pulse bg-foreground/10 h-4 rounded-md w-16" />,
	);
	expect(bone.props.importantForAccessibility).toBe('no-hide-descendants');
	expect(bone.props.accessibilityElementsHidden).toBe(true);
	expect(String(flat(bone.props.style).backgroundColor)).toMatch(/^(#|rgba?\()/);
	expect(flat(bone.props.style)).toEqual(flat(reference.props.style));
});

test('Button.Skeleton keeps its classes (shared bone + button silhouette)', async () => {
	const { bone, reference } = await pair(
		<Button.Skeleton size="lg" />,
		<View className="animate-pulse bg-foreground/10 rounded-control h-10 w-24" />,
	);
	expect(flat(bone.props.style)).toEqual(flat(reference.props.style));
	expect(bone.props.accessibilityElementsHidden).toBe(true);
});
