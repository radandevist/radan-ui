import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '../../lib/cn';
import type { InputProps } from './input.contract';
import { inputField } from './input.variants';

export const Input = ({
	type = 'text',
	onValueChange,
	invalid,
	disabled,
	className,
	accessibilityLabel,
	...rest
}: InputProps) => (
	<InputPrimitive
		{...rest}
		type={type}
		disabled={disabled}
		aria-invalid={invalid || undefined}
		aria-label={accessibilityLabel}
		onValueChange={onValueChange ? (value) => onValueChange(value) : undefined}
		className={cn(
			inputField,
			'outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground',
			'focus-visible:ring-2 focus-visible:ring-ring',
			'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive',
			'disabled:cursor-not-allowed disabled:opacity-50',
			className,
		)}
	/>
);

export { InputSkeleton } from './input.skeleton.web';
export type { InputProps, InputSkeletonProps, InputType } from './input.contract';
