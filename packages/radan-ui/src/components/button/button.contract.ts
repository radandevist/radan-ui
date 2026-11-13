import type { ReactNode } from 'react';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon';

/** The public API, identical on web and native (cross-platform spec, decision 2). */
export type ButtonProps = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	/** Waiting on the server: pressing is off, a spinner shows, `aria-busy` / `busy` is set. The caller swaps the label. */
	loading?: boolean;
	onPress?: () => void;
	/** The button itself (layout, surface). */
	className?: string;
	/** The label (text colour, size, weight). Text utilities in `className` do not reach it: on native `Text` does not inherit. */
	labelClassName?: string;
	/** The accessible name; required in practice for `size="icon"`, where the child is an icon. */
	accessibilityLabel?: string;
	children?: ReactNode;
};

export type ButtonSkeletonProps = { size?: ButtonSize; className?: string };
