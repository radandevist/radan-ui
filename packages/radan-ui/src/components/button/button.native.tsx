import { Children, isValidElement, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { cn } from '../../lib/cn';
import type { ButtonProps } from './button.contract';
import { buttonTextVariants, buttonVariants } from './button.variants';

/** Elements render as they are; each run of consecutive text children (`Save {count}`) shares one label Text. */
const labelRuns = (children: ReactNode, labelClass: string): ReactNode[] => {
	const out: ReactNode[] = [];
	let text: ReactNode[] = [];
	const flush = () => {
		if (text.length > 0) {
			out.push(
				<Text key={`label-${out.length}`} className={labelClass}>
					{text}
				</Text>,
			);
		}
		text = [];
	};
	for (const child of Children.toArray(children)) {
		if (isValidElement(child)) {
			flush();
			out.push(child);
		} else {
			text.push(child);
		}
	}
	flush();
	return out;
};

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
			{/* react-native-css maps the className text colour to ActivityIndicator's `color` prop (nativeStyleMapping). */}
			{loading && <ActivityIndicator size="small" className={labelClass} />}
			{labelRuns(children, labelClass)}
		</Pressable>
	);
};

export { ButtonSkeleton } from './button.skeleton.native';
export type { ButtonProps, ButtonSize, ButtonSkeletonProps, ButtonVariant } from './button.contract';
