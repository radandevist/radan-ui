// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { inputField, inputSkeletonBone } from './input.variants';
import { Input, InputSkeleton } from './input.web';

afterEach(cleanup);

test('one pale border, no second ring, 16 px below md and 14 px from md', () => {
	render(<Input accessibilityLabel="Name" />);
	const { className } = screen.getByRole('textbox', { name: 'Name' });
	for (const token of [
		'rounded-control',
		'border-input',
		'bg-input/50',
		'text-input-foreground',
		'text-base',
		'md:text-sm',
	]) {
		expect(className).toContain(token);
	}
	expect(className).not.toContain('shadow-raised-control');
	expect(className).toContain('focus-visible:ring-2');
});

test('onValueChange gets the text, disabled and invalid reach the element', () => {
	const onValueChange = vi.fn<(value: string) => void>();
	const { rerender } = render(<Input accessibilityLabel="Name" onValueChange={onValueChange} />);
	fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ada' } });
	expect(onValueChange).toHaveBeenCalledWith('Ada');
	rerender(<Input accessibilityLabel="Name" invalid disabled />);
	const field = screen.getByRole<HTMLInputElement>('textbox');
	expect(field.getAttribute('aria-invalid')).toBe('true');
	expect(field.disabled).toBe(true);
});

test('the skeleton has the field height and radius', () => {
	const { container } = render(<InputSkeleton />);
	expect(inputSkeletonBone).toContain('h-9');
	expect(inputField).toContain('h-9');
	expect(container.firstElementChild?.className).toContain('rounded-control');
});
