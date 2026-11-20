// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { BoneLine } from '../bone-line/bone-line.web';
import { BonePill } from '../bone-pill/bone-pill.web';
import { BoneRegion } from '../bone-region/bone-region.web';
import { BoneText } from '../bone-text/bone-text.web';
import { Button } from '../button/button.web';
import { Bone } from './bone.web';

afterEach(cleanup);

test('a bone is hidden from assistive tech, carries the token and the pulse, and never has text', () => {
	const { container } = render(<Bone className="size-10" />);
	const bone = container.firstElementChild!;
	expect(bone.getAttribute('aria-hidden')).toBe('true');
	expect(bone.className).toBe('animate-pulse bg-foreground/10 size-10');
	expect(bone.textContent).toBe('');
});

test('line size and width, pill, and a shorter last text line', () => {
	const { container } = render(
		<BoneRegion>
			<BoneLine size="lg" width="w-24" />
			<BonePill />
			<BoneText lines={3} />
		</BoneRegion>,
	);
	const [line, pill, ...text] = [...container.querySelectorAll('[aria-hidden]')];
	expect(line!.className).toContain('h-7');
	expect(line!.className).toContain('w-24');
	expect(pill!.className).toContain('rounded-3xl');
	expect(text.map((bone) => bone.className.includes('w-2/3'))).toEqual([false, false, true]);
	for (const bone of [line!, pill!, ...text]) {
		expect(bone.className).toContain('animate-pulse');
		expect(bone.className).toContain('bg-foreground/10');
	}
});

test('the region is aria-busy with one visually hidden Loading status beside it', () => {
	const { container } = render(<BoneRegion />);
	expect(screen.getByRole('status').textContent).toBe('Loading…');
	expect(screen.getByRole('status').className).toContain('sr-only');
	expect(container.querySelectorAll('[aria-busy]')).toHaveLength(1);
	expect(container.querySelector('[aria-busy]')!.contains(screen.getByRole('status'))).toBe(false);
});

test('a nested region adds no second status, and the label is overridable', () => {
	render(
		<BoneRegion label="Chargement…">
			<BoneRegion>
				<BoneLine />
			</BoneRegion>
		</BoneRegion>,
	);
	expect(screen.getAllByRole('status')).toHaveLength(1);
	expect(screen.getByRole('status').textContent).toBe('Chargement…');
	expect(document.querySelectorAll('[aria-busy]')).toHaveLength(1);
});

test('Button.Skeleton is a bone from the same library', () => {
	const { container } = render(<Button.Skeleton size="lg" />);
	expect(container.firstElementChild!.className).toBe('animate-pulse bg-foreground/10 rounded-control h-10 w-24');
	expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
});
