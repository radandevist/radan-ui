import { useState } from 'react';

import { cn } from '../../lib/cn';
import { createTapGuard } from './page-transition.back';
import type { PageBackProps } from './page-transition.contract';
import { pageBackVariants } from './page-transition.variants';

export * from './page-transition.back';
export * from './page-transition.contract';
export * from './page-transition.core';
export { PageBackSkeleton } from './page-transition.skeleton.web';

const Arrow = () => (
	<svg
		aria-hidden
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		className="size-6"
	>
		<path d="M19 12H5m6 6-6-6 6-6" />
	</svg>
);

/**
 * A screen's back arrow, in its top bar. Guarded: a second tap inside the window is ignored. It only calls `onBack`
 * (usually `goBack(...)` with the app's router); `data-page-back` lets the app's header swap its menu button for it.
 */
export const PageBack = ({ label, onBack, className, children }: PageBackProps) => {
	// Lazy init: one guard per mounted arrow, never re-created on render.
	const [guard] = useState(() => createTapGuard());
	return (
		<button
			type="button"
			aria-label={label}
			data-page-back
			onClick={() =>
				guard(() => {
					// A rejected navigation is the router's to report; the guard frees itself.
					Promise.resolve(onBack()).catch(() => undefined);
				})
			}
			className={cn(
				pageBackVariants(),
				'cursor-pointer outline-hidden hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
				className,
			)}
		>
			{children ?? <Arrow />}
		</button>
	);
};
