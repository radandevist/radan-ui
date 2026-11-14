import { cn } from '../../lib/cn';
import { Bone, Line } from '../skeleton/skeleton.skeleton.web';
import type { ToastSkeletonProps } from './toast.contract';
import { toastCard } from './toast.variants';

/** The card's shape, one bone per element: the icon tile, the label, the title. */
export const ToastSkeleton = ({ className }: ToastSkeletonProps) => (
	<div className={cn('flex w-full max-w-[400px]', toastCard, className)}>
		<Bone className="size-10 shrink-0 rounded-xl" />
		<div className="flex flex-1 flex-col gap-2">
			<Line size="xs" width="w-16" />
			<Line size="md" width="w-40" />
		</div>
	</div>
);
