import { useContext } from 'react';

import { cn } from '../../lib/cn';
import { SkeletonRegionContext } from './skeleton.context';
import type { SkeletonPartProps, SkeletonRegionProps } from './skeleton.contract';
import { Bone, Line, Pill, Text } from './skeleton.skeleton.web';
import { skeletonCard, skeletonCardBody, skeletonCardHeader, skeletonLoading, skeletonRoot } from './skeleton.variants';

// The status sits beside the busy region, not in it: a busy live region may hold its announcement back.
const Region = ({ label = skeletonLoading, className, children }: SkeletonRegionProps) =>
	useContext(SkeletonRegionContext) ? (
		<div className={className}>{children}</div>
	) : (
		<SkeletonRegionContext value>
			<span role="status" className="sr-only">
				{label}
			</span>
			<div aria-busy className={className}>
				{children}
			</div>
		</SkeletonRegionContext>
	);

const CardRoot = ({ label, className, children }: SkeletonRegionProps) => (
	<Region label={label} className={cn(skeletonCard, className)}>
		{children}
	</Region>
);
const CardHeader = ({ className, children }: SkeletonPartProps) => (
	<div className={cn(skeletonCardHeader, className)}>{children}</div>
);
const CardBody = ({ className, children }: SkeletonPartProps) => (
	<div className={cn(skeletonCardBody, className)}>{children}</div>
);
const Card = Object.assign(CardRoot, { Header: CardHeader, Body: CardBody });

const Root = ({ label, className, children }: SkeletonRegionProps) => (
	<Region label={label} className={cn(skeletonRoot, className)}>
		{children}
	</Region>
);

export const Skeleton = Object.assign(Root, { Card, Line, Pill, Text, Bone });

export type * from './skeleton.contract';
