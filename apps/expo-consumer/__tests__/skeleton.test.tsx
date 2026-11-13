import { readFileSync } from 'node:fs';

import { ButtonSkeleton } from '@radandevist/radan-ui/button';
import { Skeleton } from '@radandevist/radan-ui/skeleton';
import { render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { registerCSS } from 'react-native-css/jest';

const css = readFileSync('node_modules/.cache/tailwind-out.css', 'utf8');
beforeEach(() => {
	registerCSS(css, { inlineVariables: false, inlineRem: 16 });
});

const flat = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

const card = (
	<Skeleton.Card>
		<Skeleton.Card.Header>
			<Skeleton.Line size="sm" width="w-16" />
			<Skeleton.Pill width="w-14" />
		</Skeleton.Card.Header>
		<Skeleton.Card.Body>
			<Skeleton.Text lines={2} size="xs" />
		</Skeleton.Card.Body>
	</Skeleton.Card>
);

test('the card is a busy region that reads Loading…, on the real card surface', async () => {
	await render(card);
	const region = screen.getByLabelText('Loading…', { hidden: true });
	expect(region.props.accessibilityState).toMatchObject({ busy: true });
	expect(flat(region.props.style)).toMatchObject({ backgroundColor: '#f2f2f2', borderRadius: 14 });
});

test('a nested card adds no second Loading… node', async () => {
	await render(
		<Skeleton label="Chargement…">
			{card}
			{card}
		</Skeleton>,
	);
	expect(screen.getAllByLabelText('Chargement…', { hidden: true })).toHaveLength(1);
	expect(screen.queryByLabelText('Loading…', { hidden: true })).toBeNull();
});

test('the region is a polite live region and announces its label once on mount', async () => {
	const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
	await render(card);
	expect(screen.getByLabelText('Loading…', { hidden: true }).props.accessibilityLiveRegion).toBe('polite');
	expect(announce).toHaveBeenCalledTimes(1);
	expect(announce).toHaveBeenCalledWith('Loading…');
	announce.mockRestore();
});

test('bones are hidden from assistive tech (both flags) and carry the shared token classes', async () => {
	await render(<Skeleton.Line />);
	const bone = screen.toJSON() as { props: Record<string, unknown> };
	expect(bone.props.importantForAccessibility).toBe('no-hide-descendants');
	expect(bone.props.accessibilityElementsHidden).toBe(true);
	expect(bone.props.className).toContain('animate-pulse');
	expect(bone.props.className).toContain('bg-foreground/10');
	expect(String(flat(bone.props.style).backgroundColor)).toMatch(/^(#|rgba?\()/);
});

test('ButtonSkeleton keeps its classes (shared bone + button silhouette)', async () => {
	await render(<ButtonSkeleton size="lg" />);
	const bone = screen.toJSON() as { props: Record<string, unknown> };
	expect(bone.props.className).toBe('animate-pulse bg-foreground/10 rounded-control h-10 w-24');
	expect(bone.props.accessibilityElementsHidden).toBe(true);
});
