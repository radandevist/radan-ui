import { cn } from '../../lib/cn';
import { Bone } from '../bone/bone.web';
import type { PageBackSkeletonProps } from './page-transition.contract';
import { pageBackSkeletonVariants } from './page-transition.variants';

export const PageBackSkeleton = ({ className }: PageBackSkeletonProps) => (
	<Bone className={cn(pageBackSkeletonVariants(), className)} />
);
