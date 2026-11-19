import { cva } from 'class-variance-authority';

// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
export const pageBackVariants = cva(
	'flex size-11 shrink-0 items-center justify-center rounded-control text-foreground',
);

/** The back arrow's silhouette (the fill + pulse come from the Skeleton library). */
export const pageBackSkeletonVariants = cva('size-11 shrink-0 rounded-control');
