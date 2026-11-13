import { cva } from 'class-variance-authority';

/** The one bone, single source of the skeleton token: fill `bg-foreground/10` + one pulse; the shape comes from the className. */
export const bone = 'animate-pulse bg-foreground/10';

export const skeletonLineVariants = cva(`${bone} rounded-md`, {
	variants: { size: { xs: 'h-3', sm: 'h-4', md: 'h-5', lg: 'h-7' } },
	defaultVariants: { size: 'sm' },
});

export const skeletonPill = `${bone} h-6 rounded-3xl`;

/** The real card surface (same classes as a card), only its content is missing. */
export const skeletonCard = 'flex flex-col gap-3 bg-card p-4 rounded-card shadow-raised-control';
export const skeletonCardHeader = 'flex flex-row items-center justify-between gap-3';
export const skeletonCardBody = 'flex flex-col gap-2';
export const skeletonRoot = 'flex flex-col gap-4';
export const skeletonLoading = 'Loading…';
