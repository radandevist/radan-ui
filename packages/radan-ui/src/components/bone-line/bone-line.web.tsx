import { cn } from '../../lib/cn';
import { Bone } from '../bone/bone.web';
import type { BoneLineProps } from './bone-line.contract';
import { boneLineVariants } from './bone-line.variants';

export const BoneLine = ({ size, width = 'w-full', className }: BoneLineProps) => (
	<Bone className={cn(boneLineVariants({ size }), width, className)} />
);

export type { BoneLineProps, BoneLineSize } from './bone-line.contract';
