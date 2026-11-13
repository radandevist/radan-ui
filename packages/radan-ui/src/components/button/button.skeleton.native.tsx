import { cn } from '../../lib/cn';
import { Bone } from '../skeleton/skeleton.skeleton.native';
import type { ButtonSkeletonProps } from './button.contract';
import { buttonSkeletonVariants } from './button.variants';

export const ButtonSkeleton = ({ size, className }: ButtonSkeletonProps) => (
	<Bone className={cn(buttonSkeletonVariants({ size }), className)} />
);
