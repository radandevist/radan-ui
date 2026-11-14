import { type CSSProperties, type ReactNode, useSyncExternalStore } from 'react';
import { Toaster as Sonner } from 'sonner';

import { cn } from '../../lib/cn';
import type { ToasterProps, ToastType } from './toast.contract';
import { toastCard, toastIconVariants } from './toast.variants';

const MD = '(min-width: 768px)';
const subscribe = (notify: () => void) => {
	const query = window.matchMedia?.(MD);
	query?.addEventListener('change', notify);
	return () => query?.removeEventListener('change', notify);
};
// Server and first render pick the narrow side: the toaster shows nothing until the first toast, long after hydration.
const useFromMd = () =>
	useSyncExternalStore(
		subscribe,
		() => window.matchMedia?.(MD).matches ?? false,
		() => false,
	);

// Below md the toast slides down over the header like an Android notification: an 8 px gap under the status area.
const TOP = 'calc(env(safe-area-inset-top) + 8px)';

const Svg = ({ children, className }: { children: ReactNode; className?: string }) => (
	<svg
		aria-hidden
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		className={cn('size-5', className)}
	>
		{children}
	</svg>
);

const glyphs: Record<Exclude<ToastType, 'default'>, ReactNode> = {
	success: (
		<Svg>
			<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
			<path d="M9 12l2 2l4 -4" />
		</Svg>
	),
	info: (
		<Svg>
			<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
			<path d="M12 9h.01" />
			<path d="M11 12h1v4h1" />
		</Svg>
	),
	warning: (
		<Svg>
			<path d="M12 9v4" />
			<path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
			<path d="M12 16h.01" />
		</Svg>
	),
	error: (
		<Svg>
			<path d="M12.802 2.165l5.575 2.389c.48 .206 .863 .589 1.07 1.07l2.388 5.574c.22 .512 .22 1.092 0 1.604l-2.389 5.575c-.206 .48 -.589 .863 -1.07 1.07l-5.574 2.388c-.512 .22 -1.092 .22 -1.604 0l-5.575 -2.389a2.036 2.036 0 0 1 -1.07 -1.07l-2.388 -5.574a2.036 2.036 0 0 1 0 -1.604l2.389 -5.575c.206 -.48 .589 -.863 1.07 -1.07l5.574 -2.388a2.036 2.036 0 0 1 1.604 0z" />
			<path d="M12 8v4" />
			<path d="M12 16h.01" />
		</Svg>
	),
	loading: (
		<Svg className="animate-spin motion-reduce:animate-none">
			<path d="M21 12a9 9 0 1 1-6.2-8.56" />
		</Svg>
	),
};

const Tile = ({ type }: { type: Exclude<ToastType, 'default'> }) => (
	<span className={cn(toastIconVariants({ type }), 'bg-current/15')}>{glyphs[type]}</span>
);

// Sonner owns the position, the stack and the swipe; this only dresses its markup. Its own stylesheet is one level more
// specific than a utility, hence the `!`. The label and the time are CSS strings set on the toaster (`--toast-label-*`,
// `--toast-time`) and painted in ::before / ::after of the content, so nothing here knows the language.
const types = ['success', 'error', 'warning', 'info', 'loading'] as const;
const content = cn(
	'min-w-0! flex-1!',
	// A plain toast() has no icon tile: a spacer keeps its text aligned with the typed cards.
	'[li:not([data-type]):not(:has([data-icon]))_&]:ps-[52px]',
	'before:mb-0.5 before:block before:pe-[72px] before:text-[11px] before:leading-[1.3] before:font-semibold',
	'before:tracking-[0.08em] before:text-muted-foreground before:uppercase',
	'before:content-[var(--toast-label-default)]',
	'group-data-[type=success]:before:content-[var(--toast-label-success)]',
	'group-data-[type=error]:before:content-[var(--toast-label-error)]',
	'group-data-[type=warning]:before:content-[var(--toast-label-warning)]',
	'group-data-[type=info]:before:content-[var(--toast-label-info)]',
	'group-data-[type=loading]:before:content-[var(--toast-label-loading)]',
	// On the content, not on the card: sonner's own ::after is the hover bridge between stacked toasts.
	'after:absolute after:top-3.5 after:end-4 after:text-xs after:leading-[1.3] after:text-muted-foreground',
	'after:content-[var(--toast-time)]',
);
// `!` on the outline: sonner's own `[data-button]` / card rules reset it, a plain utility would lose.
const ring = 'focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-ring!';
const toast = cn(
	'group border-transparent! text-[13px]! text-foreground!',
	toastCard,
	ring,
	// An action chip sits at the bottom right under the time: 76 px tall so they never meet; a collapsed card behind the
	// front one keeps sonner's front height so it never overhangs its stack slot.
	"[&:has([data-button]):not([data-expanded='false'][data-front='false'])]:min-h-[76px]",
);
// A 44 px target on a phone.
const action = cn(
	'h-8! self-end! rounded-md! bg-secondary! px-3! text-[13px]! font-medium! text-foreground! max-md:h-11!',
	ring,
);

export const Toaster = ({ labels, now, theme = 'light', ...rest }: ToasterProps) => {
	const fromMd = useFromMd();
	const entries = Object.entries(labels).map(([type, text]) => [`--toast-label-${type}`, JSON.stringify(text)]);
	entries.push(['--width', 'min(400px, calc(100vw - 24px))']);
	if (now !== undefined) {
		entries.push(['--toast-time', JSON.stringify(now)]);
	}
	const vars = Object.fromEntries(entries);
	return (
		<Sonner
			position={fromMd ? 'bottom-right' : 'top-center'}
			offset={{ top: TOP }}
			mobileOffset={{ top: TOP, left: 12, right: 12 }}
			{...rest}
			theme={theme}
			icons={Object.fromEntries(types.map((type) => [type, <Tile key={type} type={type} />]))}
			// SAFETY: CSSProperties has no index signature for custom properties; every value here is a string.
			style={vars as CSSProperties}
			toastOptions={{
				classNames: {
					toast,
					content,
					title: 'text-[15px]! leading-[1.35]! font-semibold!',
					icon: 'mx-0! size-10!',
					description: 'mt-0.5! leading-[1.4]! text-muted-foreground!',
					actionButton: action,
				},
			}}
		/>
	);
};

export { toast } from 'sonner';
export { ToastSkeleton } from './toast.skeleton.web';
export type { ToasterLabels, ToasterProps, ToastSkeletonProps, ToastType } from './toast.contract';
