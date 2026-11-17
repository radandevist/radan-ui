import { Button as ButtonPrimitive } from '@base-ui/react/button';

import { cn } from '../../lib/cn';
import type { ButtonProps, ButtonSize, ButtonVariant } from './button.contract';
import { buttonTextVariants, buttonVariants } from './button.variants';

/**
 * The web Button takes the shared `ButtonProps` plus everything a native `<button>` takes (`type`, `aria-*`, `ref`,
 * `onClick`, `form`, ...) and Base UI's `render` (a link or menu trigger: `render={<a href="/x" />}` with
 * `nativeButton={false}` and `role="link"`: Base UI defaults a non-button element to `role="button"`, an explicit `role` wins). `onPress` and `onClick` both fire.
 */
export type ButtonWebProps = ButtonProps &
	Omit<ButtonPrimitive.Props, keyof ButtonProps | 'children' | 'className' | 'focusableWhenDisabled'>;

// Hover per variant: web-only states live here, never in button.variants.ts (shared with native).
const hover: Record<ButtonVariant, string> = {
	default: 'hover:bg-primary/80',
	outline: 'hover:bg-muted',
	secondary: 'hover:bg-secondary/80',
	ghost: 'hover:bg-muted',
	destructive: 'hover:bg-destructive/20',
	link: 'underline-offset-4 hover:underline',
};

// An icon-xs button holds a 12 px glyph; a glyph that sets its own size keeps it.
const glyph: Partial<Record<ButtonSize, string>> = { 'icon-xs': '[&_svg:not([class*=size-])]:size-3' };

const Spinner = () => (
	<svg
		aria-hidden
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		className="size-4 animate-spin"
	>
		<path d="M21 12a9 9 0 1 1-6.2-8.56" />
	</svg>
);

// Base UI's Button gives native-button semantics and `focusableWhenDisabled`: while `loading` the button stays
// focusable (aria-disabled), so focus is not lost and `aria-busy` is announced; a plain `disabled` leaves the tab order.
export const Button = ({
	variant = 'default',
	size,
	disabled,
	loading,
	onPress,
	className,
	labelClassName,
	accessibilityLabel,
	children,
	onClick,
	...rest
}: ButtonWebProps) => (
	<ButtonPrimitive
		aria-label={accessibilityLabel}
		{...rest}
		disabled={Boolean(disabled || loading)}
		focusableWhenDisabled={Boolean(loading)}
		aria-busy={loading || rest['aria-busy']}
		onClick={(event) => {
			onClick?.(event);
			onPress?.();
		}}
		className={cn(
			buttonVariants({ variant, size, disabled: Boolean(disabled || loading) }),
			'inline-flex shrink-0 cursor-pointer select-none whitespace-nowrap outline-none transition-colors',
			'focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none',
			hover[variant],
			glyph[size ?? 'default'],
			className,
		)}
	>
		{loading && <Spinner />}
		<span className={cn(buttonTextVariants({ variant, size }), labelClassName)}>{children}</span>
	</ButtonPrimitive>
);

export { ButtonSkeleton } from './button.skeleton.web';
export type { ButtonProps, ButtonSize, ButtonSkeletonProps, ButtonVariant } from './button.contract';
