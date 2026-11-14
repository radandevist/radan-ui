import { cn } from '../../lib/cn';
import { Skeleton } from '../skeleton/skeleton.web';
import type { ToastSkeletonProps } from './toast.contract';
import { toastCard } from './toast.variants';

/** The card's shape, one bone per element: the icon tile, the label, the title. */
export const ToastSkeleton = ({ className }: ToastSkeletonProps) => (
	<Skeleton className={cn(toastCard, 'w-full max-w-[400px] flex-row', className)}>
		<Skeleton.Bone className="size-10 shrink-0 rounded-xl" />
		<div className="flex flex-1 flex-col gap-2">
			<Skeleton.Line size="xs" width="w-16" />
			<Skeleton.Line size="md" width="w-40" />
		</div>
	</Skeleton>
);
