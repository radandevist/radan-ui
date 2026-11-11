import type { ReactNode } from 'react';

export type ButtonVariant = 'default' | 'outline';
export type ButtonSize = 'default' | 'sm';

/** The public API, identical on web and native (cross-platform spec, decision 2). */
export type ButtonProps = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	onPress?: () => void;
	className?: string;
	children?: ReactNode;
};
