import { Pressable, Text } from 'react-native';

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
			className={[buttonVariants({ variant, size, disabled: off }), 'active:opacity-80', className]
				.filter(Boolean)
				.join(' ')}
		>
			<Text className={buttonTextVariants({ variant })}>{children}</Text>
		</Pressable>
	);
};
