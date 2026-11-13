import { cn } from '../../lib/cn';
import type { ButtonSkeletonProps } from './button.contract';
import { buttonSkeletonVariants } from './button.variants';

// ponytail: self-contained bone until the shared Skeleton primitive lands (docs/rules/skeletons.md); then use it here.
export const ButtonSkeleton = ({ size, className }: ButtonSkeletonProps) => (
	<div aria-hidden className={cn(buttonSkeletonVariants({ size }), className)} />
);
