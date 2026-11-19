// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { ButtonSkeleton } from '../button/button.web';
import { Skeleton } from './skeleton.web';

afterEach(cleanup);

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

test('the card is the real surface with one bone per element, no grey block', () => {
	const { container } = render(card);
	const surface = container.querySelector('[aria-busy]')!;
	expect(surface.className).toContain('bg-card');
	expect(surface.className).toContain('rounded-card');
	const bones = [...surface.querySelectorAll('[aria-hidden]')];
	expect(bones).toHaveLength(4); // line, pill, 2 text lines
	for (const bone of bones) {
		expect(bone.className).toContain('animate-pulse');
		expect(bone.className).toContain('bg-foreground/10');
		expect(bone.textContent).toBe('');
	}
	expect(surface.className).not.toContain('animate-pulse');
});

test('line size and width, pill, and a shorter last text line', () => {
	const { container } = render(
		<Skeleton>
			<Skeleton.Line size="lg" width="w-24" />
			<Skeleton.Pill />
			<Skeleton.Text lines={3} />
		</Skeleton>,
	);
	const [line, pill, ...text] = [...container.querySelectorAll('[aria-hidden]')];
	expect(line!.className).toContain('h-7');
	expect(line!.className).toContain('w-24');
	expect(pill!.className).toContain('rounded-3xl');
	expect(text.map((bone) => bone.className.includes('w-2/3'))).toEqual([false, false, true]);
});

test('the region is aria-busy with one visually hidden Loading status beside it', () => {
	const { container } = render(card);
	expect(screen.getByRole('status').textContent).toBe('Loading…');
	expect(screen.getByRole('status').className).toContain('sr-only');
	expect(container.querySelectorAll('[aria-busy]')).toHaveLength(1);
	expect(container.querySelector('[aria-busy]')!.contains(screen.getByRole('status'))).toBe(false);
});

test('nested cards add no second status, and the label is overridable', () => {
	render(
		<Skeleton label="Chargement…">
			{card}
			{card}
		</Skeleton>,
	);
	expect(screen.getAllByRole('status')).toHaveLength(1);
	expect(screen.getByRole('status').textContent).toBe('Chargement…');
	expect(document.querySelectorAll('[aria-busy]')).toHaveLength(1);
	expect(document.querySelector('[aria-busy]')!.contains(screen.getByRole('status'))).toBe(false);
});

test('ButtonSkeleton is a bone from the same library', () => {
	const { container } = render(<ButtonSkeleton size="lg" />);
	expect(container.firstElementChild!.className).toBe('animate-pulse bg-foreground/10 rounded-control h-10 w-24');
	expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
});
