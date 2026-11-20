import { cn } from '../../lib/cn';
import { BoneLine } from '../bone-line/bone-line.web';
import type { BoneTextProps } from './bone-text.contract';
import { boneText } from './bone-text.variants';

export const BoneText = ({ lines = 3, size, className }: BoneTextProps) => (
	<div className={cn(boneText, className)}>
		{Array.from({ length: lines }, (_, index) => (
			<BoneLine key={index} size={size} width={index === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'} />
		))}
	</div>
);

export type { BoneTextProps } from './bone-text.contract';
