import { cva } from 'class-variance-authority';

// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
/** The icon tile: the colour of each type lives on the icon alone, the card, its border and its text stay neutral. */
export const toastIconVariants = cva('flex size-10 shrink-0 items-center justify-center rounded-xl', {
	variants: {
		type: {
			default: 'text-muted-foreground',
			success: 'text-status-success',
			error: 'text-destructive',
			warning: 'text-status-warning',
			// The domain status tones are not in the Tailwind bridge: read the variable (DESIGN §6).
			info: 'text-[color:var(--radan-ui-status-open-foreground)]',
			loading: 'text-muted-foreground',
		},
	},
	defaultVariants: { type: 'default' },
});

/**
 * The card surface, shared by the real toast and its skeleton: the neutral popover surface, the popover shadow, never
 * the type's colour. `!` because sonner's own stylesheet is one level more specific than a utility.
 */
export const toastCard = 'flex items-center gap-3! rounded-toast! bg-popover-surface! px-4! py-3.5! shadow-popover!';
