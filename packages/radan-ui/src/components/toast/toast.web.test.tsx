// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import type { ToasterLabels, ToasterProps } from './toast.contract';
import { toast, Toast, Toaster } from './toast.web';

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
const open = async (fire: () => void, props: Partial<ToasterProps> = {}) => {
	render(<Toaster labels={labels} containerAriaLabel="Alerts" now="now" {...props} />);
	act(fire);
	await waitFor(() => expect(card()).toBeTruthy());
	return card();
};

test('the labels and the time reach the card as CSS strings, nothing is hard-coded', async () => {
	await open(() => toast.success('Saved'));
	const style = document.querySelector<HTMLElement>('[data-sonner-toaster]')!.style;
	for (const [type, text] of Object.entries(labels)) {
		expect(style.getPropertyValue(`--toast-label-${type}`)).toBe(JSON.stringify(text));
	}
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
	expect(el.querySelector('[data-icon] span')!.className).toContain('text-destructive');
	expect(el.className).toContain('bg-popover-surface!');
	expect(el.className).not.toContain('text-destructive');
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
	const { container } = render(<Toast.Skeleton />);
	expect(container.querySelectorAll('[aria-hidden]').length).toBeGreaterThanOrEqual(3);
	expect(container.querySelector('[aria-busy]')!.className).toContain('bg-popover-surface!');
});

test('without `now` no time is painted', async () => {
	await open(() => toast.success('Saved'), { now: undefined });
	expect(document.querySelector<HTMLElement>('[data-sonner-toaster]')!.style.getPropertyValue('--toast-time')).toBe('');
});

test('the region name comes from the app, and the close button is off by default', async () => {
	const el = await open(() => toast.success('Saved'));
	expect(document.querySelector('section[aria-label]')!.getAttribute('aria-label')).toMatch(/^Alerts /);
	expect(el.querySelector('[data-close-button]')).toBeNull();
});

test('sonner props pass through: visibleToasts caps the stack, expand opens it', async () => {
	await open(
		() => {
			toast('one');
			toast('two');
			toast('three');
		},
		{ visibleToasts: 2, expand: true },
	);
	await waitFor(() => expect(document.querySelectorAll('[data-sonner-toast]').length).toBe(3));
	expect(document.querySelectorAll('[data-sonner-toast][data-visible="true"]').length).toBe(2);
	expect(card().dataset.expanded).toBe('true');
});

test('the skeleton announces the app-supplied label', () => {
	render(<Toast.Skeleton label="Chargement" />);
	expect(screen.getByRole('status').textContent).toBe('Chargement');
});

test('closeButton is not offered: the type refuses it and no ✕ renders', async () => {
	// @ts-expect-error closeButton is omitted from ToasterProps (no visible ✕ rule)
	const el = await open(() => toast.success('Saved'), { closeButton: undefined });
	expect(el.querySelector('[data-close-button]')).toBeNull();
});

test('the card, its action and the toaster list inherit the app font (sonner sets its own stack on the list)', async () => {
	await open(() => toast('Saved', { action: { label: 'Undo', onClick: () => {} } }), { className: 'mine' });
	expect(card().className).toContain('font-[inherit]!');
	expect(document.querySelector('[data-button]')!.className).toContain('font-[inherit]!');
	const list = document.querySelector<HTMLElement>('[data-sonner-toaster]')!;
	expect(list.className).toContain('font-[inherit]!');
	expect(list.className).toContain('mine');
});

test('the stack sits 24 px in on desktop and 12 px on a phone', async () => {
	await open(() => toast('Saved'));
	const style = document.querySelector<HTMLElement>('[data-sonner-toaster]')!.style;
	// jsdom has no matchMedia, so useFromMd is false: the phone offsets apply
	expect(style.getPropertyValue('--mobile-offset-left')).toBe('12px');
	expect(style.getPropertyValue('--mobile-offset-right')).toBe('12px');
	cleanup();
	vi.stubGlobal('matchMedia', (q: string) => ({
		matches: true,
		media: q,
		addEventListener() {},
		removeEventListener() {},
	}));
	try {
		await open(() => toast('Saved again'));
		const desktop = document.querySelector<HTMLElement>('[data-sonner-toaster]')!.style;
		expect(desktop.getPropertyValue('--offset-bottom')).toBe('24px');
		expect(desktop.getPropertyValue('--offset-right')).toBe('24px');
	} finally {
		vi.unstubAllGlobals();
	}
});
