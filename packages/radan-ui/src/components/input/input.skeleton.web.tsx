import { cn } from '../../lib/cn';
import { Bone } from '../skeleton/skeleton.skeleton.web';
import type { InputSkeletonProps } from './input.contract';
import { inputSkeletonBone } from './input.variants';

export const InputSkeleton = ({ className }: InputSkeletonProps) => (
	<Bone className={cn(inputSkeletonBone, className)} />
);
