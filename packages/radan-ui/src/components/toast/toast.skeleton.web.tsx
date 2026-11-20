import { cn } from '../../lib/cn';
import { BoneLine } from '../bone-line/bone-line.web';
import { BoneRegion } from '../bone-region/bone-region.web';
import { Bone } from '../bone/bone.web';
import type { ToastSkeletonProps } from './toast.contract';
import { toastCard } from './toast.variants';

/** The card's shape, one bone per element: the icon tile, the label, the title. */
export const ToastSkeleton = ({ label, className }: ToastSkeletonProps) => (
	<BoneRegion label={label} className={cn(toastCard, 'w-full max-w-[400px] flex-row', className)}>
		<Bone className="size-10 shrink-0 rounded-xl" />
		<div className="flex flex-1 flex-col gap-2">
			<BoneLine size="xs" width="w-16" />
			<BoneLine size="md" width="w-40" />
		</div>
	</BoneRegion>
);
