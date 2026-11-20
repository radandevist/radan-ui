// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import { inputField, inputSkeletonBone } from './input.variants';
import { Input } from './input.web';

afterEach(cleanup);

test("ShopKartOS's field: 1 px input line plus the hairline ring, field fill, 16 px below md and 14 px from md", () => {
	render(<Input accessibilityLabel="Name" />);
	const { className } = screen.getByRole('textbox', { name: 'Name' });
	for (const token of [
		'rounded-input',
		'border-input',
		'bg-field',
		'shadow-raised-control',
		'text-foreground',
		'text-base',
		'md:text-sm',
		'focus-visible:border-ring',
		'focus-visible:bg-background',
		'focus-visible:ring-3',
		'focus-visible:ring-ring/30',
		'aria-invalid:border-field-invalid',
		'aria-invalid:ring-field-invalid-ring',
		// an invalid field still shows focus (the plain invalid utilities come later in the CSS and would win)
		'aria-invalid:focus-visible:border-destructive',
		'aria-invalid:focus-visible:ring-destructive',
	]) {
		expect(className).toContain(token);
	}
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
	const { container } = render(<Input.Skeleton />);
	const bone = container.firstElementChild!.className;
	for (const token of inputField.split(' ').filter((t) => /^(h-|rounded-)/.test(t))) {
		expect(bone).toContain(token);
	}
	expect(inputSkeletonBone.split(' ')).toEqual(expect.arrayContaining(['h-9', 'rounded-input']));
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

test('type="date" renders a native date field in the same frame', () => {
	const onValueChange = vi.fn<(value: string) => void>();
	render(<Input type="date" accessibilityLabel="Day" onValueChange={onValueChange} />);
	const input = screen.getByLabelText('Day');
	expect(input).toHaveProperty('type', 'date');
	expect(input.className).toContain('rounded-input');
	expect(input.className).toContain('bg-field');
	fireEvent.change(input, { target: { value: '2026-11-20' } });
	expect(onValueChange).toHaveBeenCalledWith('2026-11-20');
});

test('the field carries data-slot="input"', () => {
	render(<Input accessibilityLabel="Name" />);
	expect(screen.getByRole('textbox').getAttribute('data-slot')).toBe('input');
});
