import type { ButtonProps } from './button.contract';
import { buttonTextVariants, buttonVariants } from './button.variants';

// ponytail: plain <button>; Base UI is not a dependency yet, swap it in when the first real component needs it.
export const Button = ({ variant, size, disabled, loading, onPress, className, children }: ButtonProps) => {
	const off = Boolean(disabled || loading);
	return (
		<button
			type="button"
			disabled={off}
			aria-busy={loading || undefined}
			onClick={onPress}
			className={[
				buttonVariants({ variant, size, disabled: off }),
				buttonTextVariants({ variant }),
				'hover:opacity-90 focus-visible:ring-2',
				className,
			]
				.filter(Boolean)
				.join(' ')}
		>
			{children}
		</button>
	);
};
