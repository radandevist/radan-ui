import { Pressable, Text } from 'react-native';

import { cn } from '../../lib/cn';
import type { ButtonProps } from './button.contract';
import { buttonTextVariants, buttonVariants } from './button.variants';

export const Button = ({ variant, size, disabled, loading, onPress, className, children }: ButtonProps) => {
	const off = Boolean(disabled || loading);
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled: off, busy: Boolean(loading) }}
			disabled={off}
			onPress={onPress}
			className={cn(buttonVariants({ variant, size, disabled: off }), 'active:opacity-80', className)}
		>
			<Text className={buttonTextVariants({ variant })}>{children}</Text>
		</Pressable>
	);
};

export type { ButtonProps, ButtonSize, ButtonVariant } from './button.contract';
