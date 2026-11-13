import { View } from 'react-native';

import { cn } from '../../lib/cn';
import type { ButtonSkeletonProps } from './button.contract';
import { buttonSkeletonVariants } from './button.variants';

export const ButtonSkeleton = ({ size, className }: ButtonSkeletonProps) => (
	<View
		accessibilityElementsHidden
		importantForAccessibility="no-hide-descendants"
		className={cn(buttonSkeletonVariants({ size }), className)}
	/>
);
