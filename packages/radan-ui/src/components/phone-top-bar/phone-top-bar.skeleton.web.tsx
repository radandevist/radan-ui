import { cn } from '../../lib/cn';
import { Bone } from '../bone/bone.web';
import type { PhoneTopBarSkeletonProps } from './phone-top-bar.contract';
import { phoneTopBarSkeletonVariants } from './phone-top-bar.variants';

/** The bar's silhouette: the menu button and the title, as bones. */
export const PhoneTopBarSkeleton = ({ className }: PhoneTopBarSkeletonProps) => (
	<div aria-hidden className={cn(phoneTopBarSkeletonVariants(), className)}>
		<Bone className="size-11 shrink-0 rounded-lg" />
		<Bone className="h-6 w-40 rounded-md" />
	</div>
);
