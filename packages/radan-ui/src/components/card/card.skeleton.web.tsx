import { cn } from '../../lib/cn';
import { BoneRegion } from '../bone-region/bone-region.web';
import type { CardPartProps, CardSkeletonProps } from './card.contract';
import { card, cardBody, cardHeader } from './card.variants';

// The real surface and rows, only their content is missing: compose BoneLine / BonePill / BoneText inside.
export const CardSkeleton = ({ label, className, children }: CardSkeletonProps) => (
	<BoneRegion label={label} className={cn(card, className)}>
		{children}
	</BoneRegion>
);

export const CardHeaderSkeleton = ({ className, children }: CardPartProps) => (
	<div className={cn(cardHeader, className)}>{children}</div>
);

export const CardBodySkeleton = ({ className, children }: CardPartProps) => (
	<div className={cn(cardBody, className)}>{children}</div>
);
