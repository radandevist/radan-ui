import { expect, test } from 'vitest';

import { cn } from '../src/lib/cn';

test('cn: the later utility wins, including the library theme names', () => {
	expect(cn('rounded-control', 'rounded-card')).toBe('rounded-card');
	expect(cn('rounded-control', 'rounded-4xl')).toBe('rounded-4xl');
	expect(cn('shadow-raised-control', 'shadow-popover')).toBe('shadow-popover');
	expect(cn('bg-primary', 'bg-card')).toBe('bg-card');
	expect(cn('text-primary-foreground', 'text-status-success')).toBe('text-status-success');
	// a colour and a size on `text-` do not conflict
	expect(cn('text-sm', 'text-primary-foreground')).toBe('text-sm text-primary-foreground');
});

test('cn: the library shadows and the Tailwind shadows replace each other, in both orders', () => {
	expect(cn('shadow-raised-control', 'shadow-lg')).toBe('shadow-lg');
	expect(cn('shadow-lg', 'shadow-raised-control')).toBe('shadow-raised-control');
	expect(cn('shadow-primary-raised', 'shadow-md')).toBe('shadow-md');
	expect(cn('shadow-md', 'shadow-primary-raised')).toBe('shadow-primary-raised');
});
