// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { BoneLine } from '../bone-line/bone-line.web';
import { BonePill } from '../bone-pill/bone-pill.web';
import { BoneText } from '../bone-text/bone-text.web';
import { Card } from './card.web';

afterEach(cleanup);

const skeleton = (
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

test('the real card is a surface with a header row and a body', () => {
	const { container } = render(
		<Card className="extra">
			<Card.Header>head</Card.Header>
			<Card.Body>body</Card.Body>
		</Card>,
	);
	const surface = container.firstElementChild!;
	expect(surface.className).toContain('bg-card');
	expect(surface.className).toContain('rounded-card');
	expect(surface.className).toContain('extra');
	expect(surface.children).toHaveLength(2);
	expect(surface.textContent).toBe('headbody');
});

test('the skeleton is the real surface with one bone per element, no grey block', () => {
	const { container } = render(skeleton);
	const surface = container.querySelector('[aria-busy]')!;
	expect(surface.className).toContain('bg-card');
	expect(surface.className).toContain('rounded-card');
	const bones = [...surface.querySelectorAll('[aria-hidden]')];
	expect(bones).toHaveLength(4); // line, pill, 2 text lines
	for (const bone of bones) {
		expect(bone.className).toContain('animate-pulse');
		expect(bone.textContent).toBe('');
	}
	expect(surface.className).not.toContain('animate-pulse');
});

test('the skeleton has the same classes as the real card, header and body', () => {
	const real = render(
		<Card>
			<Card.Header />
			<Card.Body />
		</Card>,
	).container.firstElementChild!;
	cleanup();
	const fake = render(
		<Card.Skeleton>
			<Card.Header.Skeleton />
			<Card.Body.Skeleton />
		</Card.Skeleton>,
	).container.querySelector('[aria-busy]')!;
	expect(fake.className).toContain(real.className);
	expect([...fake.children].map((child) => child.className)).toEqual(
		[...real.children].map((child) => child.className),
	);
});

test('nested card skeletons add no second status, and the label is overridable', () => {
	render(
		<Card.Skeleton label="Chargement…">
			{skeleton}
			{skeleton}
		</Card.Skeleton>,
	);
	expect(screen.getAllByRole('status')).toHaveLength(1);
	expect(screen.getByRole('status').textContent).toBe('Chargement…');
	expect(document.querySelectorAll('[aria-busy]')).toHaveLength(1);
});
