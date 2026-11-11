import { cva } from 'class-variance-authority';

// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
export const buttonVariants = cva('flex flex-row items-center justify-center rounded-control', {
	variants: {
		variant: {
			default: 'bg-primary',
			outline: 'bg-card shadow-raised-control',
		},
		size: { default: 'px-4 py-2', sm: 'px-3 py-1' },
		disabled: { true: 'opacity-50', false: '' },
	},
	defaultVariants: { variant: 'default', size: 'default', disabled: false },
});

/** The label colour; on native it goes on the Text, since colour is not inherited from the Pressable. */
export const buttonTextVariants = cva('text-sm font-medium', {
	variants: { variant: { default: 'text-primary-foreground', outline: 'text-card-foreground' } },
	defaultVariants: { variant: 'default' },
});
