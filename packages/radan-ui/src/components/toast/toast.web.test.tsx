// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import type { ToasterLabels } from './toast.contract';
import { toast, Toaster, ToastSkeleton } from './toast.web';

const labels: ToasterLabels = {
	default: 'Notice',
	success: 'Done',
	error: 'Error',
	warning: 'Careful',
	info: 'Info',
	loading: 'Working',
};

afterEach(() => {
	act(() => {
		toast.dismiss();
	});
	cleanup();
});

// Sonner mounts its list on the first toast, a tick after the call.
const card = () => document.querySelector<HTMLElement>('[data-sonner-toast]')!;
const open = async (fire: () => void, props: { theme?: 'dark' } = {}) => {
	render(<Toaster labels={labels} now="now" {...props} />);
	act(fire);
	await waitFor(() => expect(card()).toBeTruthy());
	return card();
};

test('the labels and the time reach the card as CSS strings, nothing is hard-coded', async () => {
	await open(() => toast.success('Saved'));
	const style = document.querySelector<HTMLElement>('[data-sonner-toaster]')!.style;
	expect(style.getPropertyValue('--toast-label-success')).toBe('"Done"');
	expect(style.getPropertyValue('--toast-label-default')).toBe('"Notice"');
	expect(style.getPropertyValue('--toast-time')).toBe('"now"');
	expect(style.getPropertyValue('--width')).toBe('min(400px, calc(100vw - 24px))');
});

test('every type is a toast with its title and its tone on a 40 px icon tile', async () => {
	for (const type of ['success', 'error', 'warning', 'info', 'loading'] as const) {
		cleanup();
		const el = await open(() => toast[type](`${type} title`));
		expect(el.dataset.type).toBe(type);
		expect(screen.getByText(`${type} title`)).toBeTruthy();
		expect(el.querySelector('[data-icon] svg')).toBeTruthy();
		expect(el.querySelector('[data-icon] span')!.className).toContain('size-10');
	}
	// A plain toast has no type: the base label (« default ») shows.
	cleanup();
	expect((await open(() => toast('plain'))).dataset.type).toBeUndefined();
});

test('the tone sits on the icon alone: the card stays neutral', async () => {
	const el = await open(() => toast.error('Failed'));
	expect(el.querySelector('[data-icon] span')!.className).toContain('text-status-breached-foreground');
	expect(el.className).toContain('bg-popover-surface!');
	expect(el.className).not.toContain('status-breached');
});

test('an action runs its handler and the card is as tall as the chip needs', async () => {
	const onClick = vi.fn<() => void>();
	const el = await open(() => toast.info('Dismissed', { action: { label: 'Undo', onClick } }));
	expect(el.className).toContain('min-h-[76px]');
	fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
	expect(onClick).toHaveBeenCalledOnce();
});

test('the theme comes from the app, and the narrow side is the top-center one', async () => {
	await open(() => toast.success('Saved'), { theme: 'dark' });
	const toaster = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
	expect(toaster.dataset.sonnerTheme).toBe('dark');
	expect(toaster.dataset.yPosition).toBe('top');
	expect(toaster.dataset.xPosition).toBe('center');
});

test('the skeleton is the card shape, hidden from assistive tech', () => {
	const { container } = render(<ToastSkeleton />);
	expect(container.querySelectorAll('[aria-hidden]').length).toBeGreaterThanOrEqual(3);
	expect(container.firstElementChild!.className).toContain('bg-popover-surface');
});
