import { View } from 'react-native';

import { cn } from '../../lib/cn';
import type { SkeletonBoneProps, SkeletonLineProps, SkeletonPillProps, SkeletonTextProps } from './skeleton.contract';
import { bone, skeletonLineVariants as skeletonLine, skeletonPill } from './skeleton.variants';

// The bones: one per real element, hidden from assistive tech, never given text or a role.
export const Bone = ({ className }: SkeletonBoneProps) => (
	<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={cn(bone, className)} />
);

export const Line = ({ size, width = 'w-full', className }: SkeletonLineProps) => (
	<Bone className={cn(skeletonLine({ size }), width, className)} />
);

export const Pill = ({ width = 'w-16', className }: SkeletonPillProps) => (
	<Bone className={cn(skeletonPill, width, className)} />
);

export const Text = ({ lines = 3, size, className }: SkeletonTextProps) => (
	<View className={cn('flex flex-col gap-2', className)}>
		{Array.from({ length: lines }, (_, index) => (
			<Line key={index} size={size} width={index === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'} />
		))}
	</View>
);
