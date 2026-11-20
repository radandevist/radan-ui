import { View } from 'react-native';

import { cn } from '../../lib/cn';
import type { BoneProps } from './bone.contract';
import { bone } from './bone.variants';

// One per real element, hidden from assistive tech, never given text or a role.
export const Bone = ({ className }: BoneProps) => (
	<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={cn(bone, className)} />
);

export type { BoneProps } from './bone.contract';
