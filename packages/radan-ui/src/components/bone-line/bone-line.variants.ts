import { cva } from 'class-variance-authority';

export const boneLineVariants = cva('rounded-md', {
	variants: { size: { xs: 'h-3', sm: 'h-4', md: 'h-5', lg: 'h-7' } },
	defaultVariants: { size: 'sm' },
});
