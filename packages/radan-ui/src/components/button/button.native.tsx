import { isValidElement } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { cn } from '../../lib/cn';
import type { ButtonProps } from './button.contract';
import { buttonTextVariants, buttonVariants } from './button.variants';

export const Button = ({
	variant,
	size,
	disabled,
	loading,
	onPress,
	className,
	labelClassName,
	accessibilityLabel,
	children,
}: ButtonProps) => {
	const off = Boolean(disabled || loading);
	const labelClass = cn(buttonTextVariants({ variant, size }), labelClassName);
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled: off, busy: Boolean(loading) }}
			disabled={off}
			onPress={onPress}
			className={cn(buttonVariants({ variant, size, disabled: off }), 'active:opacity-80', className)}
		>
			{loading && <ActivityIndicator size="small" className={labelClass} />}
			{isValidElement(children) ? children : <Text className={labelClass}>{children}</Text>}
		</Pressable>
	);
};

export { ButtonSkeleton } from './button.skeleton.native';
export type { ButtonProps, ButtonSize, ButtonSkeletonProps, ButtonVariant } from './button.contract';
