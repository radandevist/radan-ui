import { useContext, useEffect } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';

import { cn } from '../../lib/cn';
import { BoneRegionContext } from './bone-region.context';
import type { BoneRegionProps } from './bone-region.contract';
import { boneLoading, boneRegion } from './bone-region.variants';

// One accessible node that reads "Loading…" and is busy; its bones are hidden from the screen reader. Android reads the
// polite live region; iOS has none, so the label is announced once on mount (React Native's documented way).
const Busy = ({ label, className, children }: Required<Pick<BoneRegionProps, 'label'>> & BoneRegionProps) => {
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

export const BoneRegion = ({ label = boneLoading, className, children }: BoneRegionProps) =>
	useContext(BoneRegionContext) ? (
		<View className={cn(boneRegion, className)}>{children}</View>
	) : (
		<BoneRegionContext value>
			<Busy label={label} className={cn(boneRegion, className)}>
				{children}
			</Busy>
		</BoneRegionContext>
	);

export type { BoneRegionProps } from './bone-region.contract';
