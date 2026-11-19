import { extendTailwindMerge } from 'tailwind-merge';

import { tailwindColors } from '../theme/tokens';

// The library's own theme names, so `rounded-card` vs `rounded-4xl` (or `bg-primary` vs `bg-card`) are known conflicts.
const twMerge = extendTailwindMerge<'radan-shadow'>({
	extend: {
		theme: {
			color: [...tailwindColors],
			radius: ['card', 'control', 'popover', 'toast'],
		},
		// `shadow-popover` is also a colour name: a group of its own, defined after the built-ins, so the shadow reading wins.
		classGroups: { 'radan-shadow': [{ shadow: ['raised-control', 'primary-raised', 'popover'] }] },
		conflictingClassGroups: { 'radan-shadow': ['shadow'], shadow: ['radan-shadow'] },
	},
});

/** Joins class names; a later utility wins over a conflicting earlier one (the consumer's `className` comes last). */
export const cn = (...classes: (string | false | null | undefined)[]) => twMerge(classes.filter(Boolean).join(' '));
