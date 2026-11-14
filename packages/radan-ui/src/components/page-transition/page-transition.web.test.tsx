// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageBack, PageBackSkeleton } from './page-transition.web';

afterEach(cleanup);

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

describe('PageBackSkeleton', () => {
	it('is a hidden bone, no role', () => {
		const { container } = render(<PageBackSkeleton className="extra" />);
		const bone = container.firstElementChild!;
		expect(bone.getAttribute('aria-hidden')).toBe('true');
		expect(bone.className).toContain('extra');
	});
});
