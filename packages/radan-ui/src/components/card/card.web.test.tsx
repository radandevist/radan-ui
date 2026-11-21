// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { BonePill } from '../bone-pill/bone-pill.web';
import { BoneText } from '../bone-text/bone-text.web';
import { Card } from './card.web';

afterEach(cleanup);

const skeleton = (
	<Card.Skeleton>
		<Card.Header.Skeleton>
			<Card.Header.Heading.Skeleton>
				<Card.Header.Icon.Skeleton />
				<Card.Header.Label.Skeleton />
			</Card.Header.Heading.Skeleton>
			<BonePill width="w-14" />
		</Card.Header.Skeleton>
		<Card.Body.Skeleton>
			<BoneText lines={2} size="xs" />
		</Card.Body.Skeleton>
	</Card.Skeleton>
);

test('the real card is the double wall: a bg-card frame with a header row, and a bordered bg-background panel', () => {
	const { container } = render(
		<Card className="extra">
			<Card.Header>
				<Card.Header.Heading>
					<Card.Header.Icon>
						<svg />
					</Card.Header.Icon>
					<Card.Header.Label>title</Card.Header.Label>
				</Card.Header.Heading>
			</Card.Header>
			<Card.Body>body</Card.Body>
		</Card>,
	);
	const surface = container.firstElementChild!;
	for (const cls of ['bg-card', 'rounded-card', 'p-1', 'shadow-raised-control', 'extra']) {
		expect(surface.className).toContain(cls);
	}
	expect(surface.children).toHaveLength(2);
	expect(surface.textContent).toBe('titlebody');
	const [header, body] = [...surface.children];
	expect(header!.className).toContain('px-3 pt-1 pb-2');
	expect(screen.getByText('title').className).toContain('uppercase');
	expect(body!.className).toContain('bg-background');
	expect(body!.className).toContain('rounded-card-body');
	expect(body!.className).toContain('border');
});

test('the skeleton is the real surface with one bone per element, no grey block', () => {
	const { container } = render(skeleton);
	const surface = container.querySelector('[aria-busy]')!;
	expect(surface.className).toContain('bg-card');
	expect(surface.className).toContain('rounded-card');
	const bones = [...surface.querySelectorAll('[aria-hidden]')];
	expect(bones).toHaveLength(5); // icon, label, pill, 2 text lines
	for (const bone of bones) {
		expect(bone.className).toContain('animate-pulse');
		expect(bone.textContent).toBe('');
	}
	expect(surface.className).not.toContain('animate-pulse');
	expect(surface.className).toContain('gap-0');
	expect(surface.className).not.toContain('gap-4'); // no gap between the header and the panel, as on the real card
});

test('the skeleton has the same classes as the real card, header and body', () => {
	const real = render(
		<Card>
			<Card.Header>
				<Card.Header.Heading>
					<Card.Header.Icon />
					<Card.Header.Label />
				</Card.Header.Heading>
			</Card.Header>
			<Card.Body />
		</Card>,
	).container.firstElementChild!;
	cleanup();
	const fake = render(
		<Card.Skeleton>
			<Card.Header.Skeleton>
				<Card.Header.Heading.Skeleton>
					<Card.Header.Icon.Skeleton />
					<Card.Header.Label.Skeleton />
				</Card.Header.Heading.Skeleton>
			</Card.Header.Skeleton>
			<Card.Body.Skeleton />
		</Card.Skeleton>,
	).container.querySelector('[aria-busy]')!;
	expect(fake.className).toContain(real.className);
	expect([...fake.children].map((child) => child.className)).toEqual(
		[...real.children].map((child) => child.className),
	);
	// the heading group has the real group's layout, the icon bone the icon slot's size
	const realHeading = real.firstElementChild!.firstElementChild!;
	const fakeHeading = fake.firstElementChild!.firstElementChild!;
	expect(fakeHeading.className).toContain(realHeading.className.replace(' text-muted-foreground', ''));
	expect(fakeHeading.firstElementChild!.className).toContain('size-3.5');
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
