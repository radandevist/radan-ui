import { View } from 'react-native';

import { cn } from '../../lib/cn';
import { BoneLine } from '../bone-line/bone-line.native';
import { BoneRegion } from '../bone-region/bone-region.native';
import { Bone } from '../bone/bone.native';
import type { CardIconSkeletonProps, CardLabelSkeletonProps, CardPartProps, CardSkeletonProps } from './card.contract';
import { card, cardBody, cardHeader, cardHeading, cardIcon } from './card.variants';

// The real frame and rows, only their content is missing: compose BoneLine / BonePill / BoneText inside.
export const CardSkeleton = ({ label, className, children }: CardSkeletonProps) => (
	<BoneRegion label={label} className={cn(card, className)}>
		{children}
	</BoneRegion>
);

export const CardHeaderSkeleton = ({ className, children }: CardPartProps) => (
	<View className={cn(cardHeader, className)}>{children}</View>
);

export const CardHeadingSkeleton = ({ className, children }: CardPartProps) => (
	<View className={cn(cardHeading, className)}>{children}</View>
);

/** The icon bone: the 14 px slot. */
export const CardIconSkeleton = ({ className }: CardIconSkeletonProps) => (
	<Bone className={cn(cardIcon, 'rounded', className)} />
);

/** The label bone: one 16 px line, the height of the 12 px capitals' line box. */
export const CardLabelSkeleton = ({ width = 'w-24', className }: CardLabelSkeletonProps) => (
	<BoneLine size="sm" width={width} className={className} />
);

export const CardBodySkeleton = ({ className, children }: CardPartProps) => (
	<View className={cn(cardBody, className)}>{children}</View>
);
