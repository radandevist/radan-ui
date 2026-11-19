// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, type FormEvent } from 'react';
import { afterEach, expect, test, vi } from 'vitest';

import type { ButtonSize, ButtonVariant } from './button.contract';
import { Button, ButtonSkeleton } from './button.web';

afterEach(cleanup);

const variants: ButtonVariant[] = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'];
const sizes: ButtonSize[] = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'];

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
	cleanup();
	render(
		<Button size="icon-xs" accessibilityLabel="x">
			+
		</Button>,
	);
	expect(screen.getByRole('button').className).toContain('size-6');
	cleanup();
	render(
		<Button size="icon-xs" accessibilityLabel="x">
			<svg data-testid="plain" />
		</Button>,
	);
	expect(screen.getByRole('button').className).toContain('[&_svg:not([class*=size-])]:size-3');
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

test('native button props pass through: type, aria-*, ref, onClick, form', () => {
	const ref = createRef<HTMLButtonElement>();
	const onClick = vi.fn<() => void>();
	const onPress = vi.fn<() => void>();
	render(
		<Button
			ref={ref}
			type="submit"
			form="f"
			aria-haspopup="menu"
			aria-expanded={false}
			onClick={onClick}
			onPress={onPress}
		>
			Go
		</Button>,
	);
	const button = screen.getByRole('button');
	expect(ref.current).toBe(button);
	expect(button.getAttribute('type')).toBe('submit');
	expect(button.getAttribute('form')).toBe('f');
	expect(button.getAttribute('aria-haspopup')).toBe('menu');
	expect(button.getAttribute('aria-expanded')).toBe('false');
	fireEvent.click(button);
	expect(onClick).toHaveBeenCalledTimes(1);
	expect(onPress).toHaveBeenCalledTimes(1);
});

test('type defaults to button (never submits a form by accident) and submit submits', () => {
	const onSubmit = vi.fn<(e: FormEvent) => void>((e) => e.preventDefault());
	render(
		<form onSubmit={onSubmit}>
			<Button>Plain</Button>
			<Button type="submit">Send</Button>
		</form>,
	);
	fireEvent.click(screen.getByRole('button', { name: 'Plain' }));
	expect(onSubmit).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole('button', { name: 'Send' }));
	expect(onSubmit).toHaveBeenCalledTimes(1);
});

test('an explicit aria-label wins; loading keeps aria-busy', () => {
	render(
		<Button accessibilityLabel="a" aria-label="b" loading>
			Go
		</Button>,
	);
	const button = screen.getByRole('button');
	expect(button.getAttribute('aria-label')).toBe('b');
	expect(button.getAttribute('aria-busy')).toBe('true');
});

test('render-as: a link (role="link" wins over the default button role) keeps the button styling and onPress', () => {
	const onPress = vi.fn<() => void>();
	render(
		<Button role="link" render={<a href="/x" />} nativeButton={false} variant="outline" onPress={onPress}>
			Open
		</Button>,
	);
	const link = screen.getByRole('link', { name: 'Open' });
	expect(link.tagName).toBe('A');
	expect(link.getAttribute('href')).toBe('/x');
	expect(link.className).toContain('rounded-control');
	fireEvent.click(link);
	expect(onPress).toHaveBeenCalledTimes(1);
});
