import { cn } from '../../lib/cn';
import { Bone } from '../bone/bone.native';
import type { BonePillProps } from './bone-pill.contract';
import { bonePill } from './bone-pill.variants';

export const BonePill = ({ width = 'w-16', className }: BonePillProps) => (
	<Bone className={cn(bonePill, width, className)} />
);

export type { BonePillProps } from './bone-pill.contract';
