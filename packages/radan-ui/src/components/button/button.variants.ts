import { cva } from 'class-variance-authority';

// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
export const buttonVariants = cva('flex flex-row items-center justify-center rounded-control', {
	variants: {
		variant: {
			default: 'bg-primary shadow-primary-raised',
			outline: 'bg-background shadow-raised-control',
			secondary: 'bg-secondary shadow-raised-control',
			ghost: '',
			destructive: 'bg-destructive-surface',
			link: '',
		},
		size: {
			default: 'h-9 gap-1.5 px-3',
			xs: 'h-6 gap-1 px-2.5',
			sm: 'h-8 gap-1 px-3',
			lg: 'h-10 gap-1.5 px-4',
			icon: 'size-9',
		},
		disabled: { true: 'opacity-50', false: '' },
	},
	defaultVariants: { variant: 'default', size: 'default', disabled: false },
});

/** The label; on native it goes on the Text, since colour is not inherited from the Pressable (web uses it on a span). */
export const buttonTextVariants = cva('font-medium', {
	variants: {
		variant: {
			default: 'text-primary-foreground',
			outline: 'text-foreground',
			secondary: 'text-secondary-foreground',
			ghost: 'text-foreground',
			destructive: 'text-destructive',
			link: 'text-foreground',
		},
		size: { default: 'text-sm', xs: 'text-xs', sm: 'text-sm', lg: 'text-sm', icon: 'text-sm' },
	},
	defaultVariants: { variant: 'default', size: 'default' },
});

/** The skeleton bone: the button's silhouette (same height and radius; the width stands for a short label). */
export const buttonSkeletonVariants = cva('animate-pulse rounded-control bg-foreground/10', {
	variants: { size: { default: 'h-9 w-20', xs: 'h-6 w-14', sm: 'h-8 w-16', lg: 'h-10 w-24', icon: 'size-9' } },
	defaultVariants: { size: 'default' },
});
