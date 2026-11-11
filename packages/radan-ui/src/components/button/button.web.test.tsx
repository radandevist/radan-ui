// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import type { ButtonSize, ButtonVariant } from './button.contract';
import { Button, ButtonSkeleton } from './button.web';

afterEach(cleanup);

const variants: ButtonVariant[] = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'];
const sizes: ButtonSize[] = ['default', 'xs', 'sm', 'lg', 'icon'];

test('every variant and size renders a button with its own classes', () => {
	for (const variant of variants) {
		for (const size of sizes) {
			render(
				<Button variant={variant} size={size} accessibilityLabel={`${variant}-${size}`}>
					Go
				</Button>,
			);
			expect(screen.getByRole('button', { name: `${variant}-${size}` }).className).toContain('rounded-control');
		}
	}
	cleanup();
	render(<Button variant="destructive">Go</Button>);
	expect(screen.getByRole('button').className).toContain('bg-destructive-surface');
	cleanup();
	render(<Button size="lg">Go</Button>);
	expect(screen.getByRole('button').className).toContain('h-10');
});

test('onPress fires on click, not when disabled', () => {
	const onPress = vi.fn<() => void>();
	const { rerender } = render(<Button onPress={onPress}>Go</Button>);
	fireEvent.click(screen.getByRole('button'));
	expect(onPress).toHaveBeenCalledTimes(1);
	rerender(
		<Button onPress={onPress} disabled>
			Go
		</Button>,
	);
	fireEvent.click(screen.getByRole('button'));
	expect(onPress).toHaveBeenCalledTimes(1);
});

test('loading: aria-busy, a spinner, still focusable, no press', () => {
	const onPress = vi.fn<() => void>();
	render(
		<Button loading onPress={onPress}>
			Saving
		</Button>,
	);
	const button = screen.getByRole('button');
	expect(button.getAttribute('aria-busy')).toBe('true');
	expect(button.querySelector('svg.animate-spin')).not.toBeNull();
	expect(button.hasAttribute('disabled')).toBe(false); // focusableWhenDisabled: aria-disabled instead
	expect(button.getAttribute('aria-disabled')).toBe('true');
	fireEvent.click(button);
	expect(onPress).not.toHaveBeenCalled();
	cleanup();
	render(<Button>Idle</Button>);
	expect(screen.getByRole('button').hasAttribute('aria-busy')).toBe(false);
});

test('className lands on the button, labelClassName on the label, and they replace conflicting utilities', () => {
	render(
		<Button className="rounded-4xl" labelClassName="text-status-success">
			Go
		</Button>,
	);
	const button = screen.getByRole('button');
	expect(button.className).toContain('rounded-4xl');
	expect(button.className).not.toContain('rounded-control');
	const label = screen.getByText('Go');
	expect(label.className).toContain('text-status-success');
	expect(label.className).not.toContain('text-primary-foreground');
});

test('the skeleton is one hidden bone with the button silhouette', () => {
	const { container } = render(<ButtonSkeleton size="lg" />);
	const bone = container.firstElementChild!;
	expect(bone.getAttribute('aria-hidden')).toBe('true');
	expect(bone.className).toContain('h-10');
	expect(bone.className).toContain('bg-foreground/10');
});
