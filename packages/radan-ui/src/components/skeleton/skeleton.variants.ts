import { cva } from 'class-variance-authority';

import { skeletonBone } from '../../lib/skeleton';

/** The one bone: fill + pulse come from `src/lib/skeleton.ts`, the shape from the className. */
export const bone = skeletonBone;

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
