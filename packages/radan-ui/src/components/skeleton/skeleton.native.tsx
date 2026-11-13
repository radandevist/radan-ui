import { useContext, useEffect } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';

import { cn } from '../../lib/cn';
import { SkeletonRegionContext } from './skeleton.context';
import type { SkeletonPartProps, SkeletonRegionProps } from './skeleton.contract';
import { Bone, Line, Pill, Text } from './skeleton.skeleton.native';
import { skeletonCard, skeletonCardBody, skeletonCardHeader, skeletonLoading, skeletonRoot } from './skeleton.variants';

// One accessible node that reads "Loading…" and is busy; its bones are hidden from the screen reader. Android reads the
// polite live region; iOS has none, so the label is announced once on mount (React Native's documented way).
const Busy = ({ label, className, children }: Required<Pick<SkeletonRegionProps, 'label'>> & SkeletonRegionProps) => {
	useEffect(() => {
		// Android reads the live region below: announcing too would make TalkBack say it twice.
		if (Platform.OS === 'ios') {
			AccessibilityInfo.announceForAccessibility(label);
		}
	}, [label]);
	return (
		<View
			accessible
			accessibilityLabel={label}
			accessibilityLiveRegion="polite"
			accessibilityState={{ busy: true }}
			className={className}
		>
			{children}
		</View>
	);
};

const Region = ({ label = skeletonLoading, className, children }: SkeletonRegionProps) =>
	useContext(SkeletonRegionContext) ? (
		<View className={className}>{children}</View>
	) : (
		<SkeletonRegionContext value>
			<Busy label={label} className={className}>
				{children}
			</Busy>
		</SkeletonRegionContext>
	);

const CardRoot = ({ label, className, children }: SkeletonRegionProps) => (
	<Region label={label} className={cn(skeletonCard, className)}>
		{children}
	</Region>
);
const CardHeader = ({ className, children }: SkeletonPartProps) => (
	<View className={cn(skeletonCardHeader, className)}>{children}</View>
);
const CardBody = ({ className, children }: SkeletonPartProps) => (
	<View className={cn(skeletonCardBody, className)}>{children}</View>
);
const Card = Object.assign(CardRoot, { Header: CardHeader, Body: CardBody });

const Root = ({ label, className, children }: SkeletonRegionProps) => (
	<Region label={label} className={cn(skeletonRoot, className)}>
		{children}
	</Region>
);

export const Skeleton = Object.assign(Root, { Card, Line, Pill, Text, Bone });

export type * from './skeleton.contract';
