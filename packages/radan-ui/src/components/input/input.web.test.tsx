// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
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

test('the skeleton renders the field height and radius', () => {
	const { container } = render(<InputSkeleton />);
	const bone = container.firstElementChild!.className;
	for (const token of inputField.split(' ').filter((t) => /^(h-|rounded-)/.test(t))) {
		expect(bone).toContain(token);
	}
	expect(inputSkeletonBone.split(' ')).toEqual(expect.arrayContaining(['h-9', 'rounded-control']));
});

test('native and ARIA props pass through: describedby, required, maxLength, ref, onBlur, aria-label', () => {
	const ref = createRef<HTMLInputElement>();
	const onBlur = vi.fn<() => void>();
	render(
		<Input
			ref={ref}
			invalid
			id="email"
			aria-describedby="email-error"
			aria-errormessage="email-error"
			aria-label="Email"
			required
			readOnly
			maxLength={5}
			onBlur={onBlur}
		/>,
	);
	const field = screen.getByRole<HTMLInputElement>('textbox', { name: 'Email' });
	expect(ref.current).toBe(field);
	expect(field.getAttribute('aria-describedby')).toBe('email-error');
	expect(field.getAttribute('aria-errormessage')).toBe('email-error');
	expect(field.getAttribute('aria-invalid')).toBe('true');
	expect(field.required && field.readOnly && field.maxLength === 5).toBe(true);
	fireEvent.blur(field);
	expect(onBlur).toHaveBeenCalledTimes(1);
});

test('the field keeps a forced-colors focus outline', () => {
	render(<Input accessibilityLabel="Name" />);
	expect(screen.getByRole('textbox').className).toContain('forced-colors:focus-visible:outline-2');
});
