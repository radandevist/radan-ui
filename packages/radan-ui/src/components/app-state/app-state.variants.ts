import { cva } from 'class-variance-authority';

import type { EmptyStateSize, StateTone } from './app-state.contract';

/**
 * The tones, exactly as ShopKartOS wrote them: literal strings, because Tailwind only generates what it can read in
 * the source. `info`→`status-open`, `neutral`→`status-closed`, `warning`→`status-pending`, `danger`→`status-breached`;
 * there is no `status-info` and no fifth tone.
 */
export const stateTones = {
	info: {
		halo: 'bg-[var(--radan-ui-status-open-background)] border-[var(--radan-ui-status-open-border)]',
		tile: 'bg-[var(--radan-ui-status-open-background)] border-[var(--radan-ui-status-open-border)] text-[var(--radan-ui-status-open-foreground)]',
	},
	neutral: {
		halo: 'bg-[var(--radan-ui-status-closed-background)] border-[var(--radan-ui-status-closed-border)]',
		tile: 'bg-[var(--radan-ui-status-closed-background)] border-[var(--radan-ui-status-closed-border)] text-[var(--radan-ui-status-closed-foreground)]',
	},
	warning: {
		halo: 'bg-[var(--radan-ui-status-pending-background)] border-[var(--radan-ui-status-pending-border)]',
		tile: 'bg-[var(--radan-ui-status-pending-background)] border-[var(--radan-ui-status-pending-border)] text-[var(--radan-ui-status-pending-foreground)]',
	},
	danger: {
		halo: 'bg-[var(--radan-ui-status-breached-background)] border-[var(--radan-ui-status-breached-border)]',
		tile: 'bg-[var(--radan-ui-status-breached-background)] border-[var(--radan-ui-status-breached-border)] text-[var(--radan-ui-status-breached-foreground)]',
	},
} satisfies Record<StateTone, { halo: string; tile: string }>;

/** The error block: one 144 px pictogram, `h1` 20 px, one sentence, the actions and the disclosure. */
export const errorState = {
	root: 'flex min-h-[60dvh] items-center justify-center px-4 py-10',
	block: 'flex w-full max-w-sm flex-col items-center text-center',
	pictogram: 'relative grid size-36 place-items-center',
	ring: 'absolute inset-0 rounded-full border opacity-30',
	innerRing: 'absolute inset-4 rounded-full border opacity-60',
	tile: 'relative grid size-16 rotate-[-6deg] place-items-center rounded-control border shadow-raised-control',
	glyph: 'size-8 rotate-[6deg]',
	title: 'mt-4 text-xl font-semibold text-balance',
	description: 'mt-2 text-sm text-pretty text-muted-foreground',
	actions: 'mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center',
	details: 'group mt-8 w-full text-left text-xs text-muted-foreground',
	summary:
		'flex min-h-11 cursor-pointer list-none items-center justify-center gap-1 select-none [&::-webkit-details-marker]:hidden',
	pre: 'max-h-48 overflow-auto rounded-[10px] border bg-card p-3 font-mono text-[11px] leading-4 whitespace-pre-wrap break-all',
	chevron: 'tabler-icon tabler-icon-chevron-down size-3.5 transition-transform group-open:rotate-180',
} as const;

/** The empty block: two card rings, a 120 px (96 px compact) pictogram, `h2` 18 px (16 px), the text and the actions. */
export const emptyState = cva('flex flex-col items-center px-4 text-center', {
	variants: { size: { default: 'py-12', compact: 'py-8' } },
	defaultVariants: { size: 'default' },
});

/** The empty pictogram parts the size switches, in ShopKartOS's class order. */
export const emptyStateParts = {
	pictogram: { default: 'size-[120px]', compact: 'size-24' },
	innerRing: { default: 'inset-3.5', compact: 'inset-3' },
	tile: { default: 'size-14 rounded-control', compact: 'size-11 rounded-control' },
	glyph: { default: 'size-7', compact: 'size-6' },
	title: { default: 'text-lg', compact: 'text-base' },
	text: { default: 'text-sm leading-normal', compact: 'text-[13.5px] leading-normal' },
} satisfies Record<string, Record<EmptyStateSize, string>>;

/** The empty block's fixed classes; the size-dependent ones come from `emptyStateParts`. */
export const emptyStateFixed = {
	pictogram: 'relative',
	ring: 'absolute inset-0 rounded-full border bg-card opacity-45',
	innerRing: 'absolute rounded-full border bg-card opacity-90',
	tile: 'absolute top-1/2 left-1/2 flex -translate-1/2 -rotate-6 items-center justify-center border bg-background shadow-[var(--radan-ui-effect-raised-control)]',
	glyph: 'rotate-6',
	title: 'mt-3 leading-[1.3] font-semibold text-balance',
	text: 'mt-1.5 max-w-[380px] text-pretty text-muted-foreground',
	actions: 'mt-5 flex flex-wrap justify-center gap-2',
	glyphTint: 'text-muted-foreground',
} as const;
