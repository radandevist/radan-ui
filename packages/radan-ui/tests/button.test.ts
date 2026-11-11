import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';

import { Button } from '../src/components/button/button.web';
import { cn } from '../src/lib/cn';

const html = (className?: string) => renderToStaticMarkup(createElement(Button, { className }, 'Go'));

test('cn: the later utility wins, including the library theme names', () => {
	expect(cn('rounded-control', 'rounded-card')).toBe('rounded-card');
	expect(cn('rounded-control', 'rounded-4xl')).toBe('rounded-4xl');
	expect(cn('shadow-raised-control', 'shadow-popover')).toBe('shadow-popover');
	expect(cn('bg-primary', 'bg-card')).toBe('bg-card');
	expect(cn('text-primary-foreground', 'text-status-success')).toBe('text-status-success');
	// a colour and a size on `text-` do not conflict
	expect(cn('text-sm', 'text-primary-foreground')).toBe('text-sm text-primary-foreground');
});

test('web Button: the consumer className replaces the conflicting variant utility', () => {
	const out = html('rounded-4xl bg-card');
	expect(out).toContain('rounded-4xl');
	expect(out).not.toContain('rounded-control');
	expect(out).toContain('bg-card');
	expect(out).not.toContain('bg-primary');
	expect(html()).toContain('rounded-control');
});
