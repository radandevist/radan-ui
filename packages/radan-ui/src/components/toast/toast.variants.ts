import { cva } from 'class-variance-authority';

// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
/** The icon tile: the colour of each type lives on the icon alone, the card, its border and its text stay neutral. */
export const toastIconVariants = cva('flex size-10 shrink-0 items-center justify-center rounded-xl', {
	variants: {
		type: {
			default: 'text-muted-foreground',
			success: 'text-status-resolved-foreground',
			error: 'text-status-breached-foreground',
			warning: 'text-status-pending-foreground',
			info: 'text-status-open-foreground',
			loading: 'text-muted-foreground',
		},
	},
	defaultVariants: { type: 'default' },
});

/** The card surface: the neutral popover surface, the popover shadow, never the type's colour. */
export const toastCard = 'flex-row items-center gap-3 rounded-[20px] bg-popover-surface p-4 shadow-popover';
