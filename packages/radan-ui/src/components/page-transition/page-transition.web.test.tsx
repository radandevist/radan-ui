// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOTION_SCRIPT, MotionScript, PageBack } from './page-transition.web';

afterEach(() => {
	cleanup();
	delete document.documentElement.dataset.motion;
});

describe('PageBack', () => {
	it('is a named button the app header can find', () => {
		render(<PageBack label="Back" onBack={() => {}} />);
		const button = screen.getByRole('button', { name: 'Back' });
		expect(button.hasAttribute('data-page-back')).toBe(true);
		expect(button.getAttribute('type')).toBe('button');
	});

	it('calls onBack once for two quick taps', () => {
		const onBack = vi.fn<() => void>();
		render(<PageBack label="Back" onBack={onBack} />);
		const button = screen.getByRole('button', { name: 'Back' });
		fireEvent.click(button);
		fireEvent.click(button);
		expect(onBack).toHaveBeenCalledOnce();
	});

	it('swallows a rejected navigation', async () => {
		const unhandled = vi.fn<() => void>();
		process.on('unhandledRejection', unhandled);
		render(<PageBack label="Back" onBack={() => Promise.reject(new Error('nope'))} />);
		fireEvent.click(screen.getByRole('button', { name: 'Back' }));
		await new Promise((resolve) => setTimeout(resolve, 0));
		process.off('unhandledRejection', unhandled);
		expect(unhandled).not.toHaveBeenCalled();
	});

	it('keeps a focus outline in forced colors', () => {
		render(<PageBack label="Back" onBack={() => {}} />);
		const { className } = screen.getByRole('button', { name: 'Back' });
		expect(className).toContain('outline-hidden');
		expect(className).not.toContain('outline-none');
	});

	it('takes a className and its own icon', () => {
		render(
			<PageBack label="Back" onBack={() => {}} className="fixed">
				<span>x</span>
			</PageBack>,
		);
		const button = screen.getByRole('button', { name: 'Back' });
		expect(button.className).toContain('fixed');
		expect(button.textContent).toBe('x');
	});
});

describe('PageBack.Skeleton', () => {
	it('is a hidden bone, no role', () => {
		const { container } = render(<PageBack.Skeleton className="extra" />);
		const bone = container.firstElementChild!;
		expect(bone.getAttribute('aria-hidden')).toBe('true');
		expect(bone.className).toContain('extra');
	});
});

describe('MotionScript', () => {
	it('is the inline pre-paint script, with the request nonce', () => {
		const html = renderToString(<MotionScript nonce="n0nce" />);
		expect(html).toContain('<script nonce="n0nce">');
		expect(html).toContain(MOTION_SCRIPT);
	});

	it('renders no nonce attribute without one', () => {
		expect(renderToString(<MotionScript />)).not.toContain('nonce');
	});

	it('writes <html data-motion> again once mounted (a swapped document emptied it)', () => {
		localStorage.setItem('radan-ui:page-transition', 'material');
		render(<MotionScript />);
		expect(document.documentElement.dataset.motion).toBe('material');
		localStorage.removeItem('radan-ui:page-transition');
	});

	// The browser strips `nonce` from the DOM after parsing, so hydration would see a mismatch without the flag.
	it('hydrates over a nonce-stripped script without a mismatch warning', async () => {
		const { hydrateRoot } = await import('react-dom/client');
		const { act } = await import('react');
		const html = renderToString(<MotionScript nonce="n0nce" />);
		const host = document.createElement('div');
		host.innerHTML = html.replace(' nonce="n0nce"', '');
		const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
		await act(async () => void hydrateRoot(host, <MotionScript nonce="n0nce" />));
		expect(errors).not.toHaveBeenCalled();
		errors.mockRestore();
	});
});
