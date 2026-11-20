import { useContext } from 'react';

import { cn } from '../../lib/cn';
import { BoneRegionContext } from './bone-region.context';
import type { BoneRegionProps } from './bone-region.contract';
import { boneLoading, boneRegion } from './bone-region.variants';

// The status sits beside the busy region, not in it: a busy live region may hold its announcement back.
export const BoneRegion = ({ label = boneLoading, className, children }: BoneRegionProps) =>
	useContext(BoneRegionContext) ? (
		<div className={cn(boneRegion, className)}>{children}</div>
	) : (
		<BoneRegionContext value>
			<span role="status" className="sr-only">
				{label}
			</span>
			<div aria-busy className={cn(boneRegion, className)}>
				{children}
			</div>
		</BoneRegionContext>
	);

export type { BoneRegionProps } from './bone-region.contract';
