import type { ComponentPropsWithRef } from 'react';

export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';

/** The public API of the single-line field. Controlled (`value` + `onValueChange`) or not (`defaultValue`). */
export type InputProps = Omit<
	ComponentPropsWithRef<'input'>,
	'type' | 'value' | 'defaultValue' | 'onChange' | 'className' | 'inputMode'
> & {
	type?: InputType;
	value?: string;
	defaultValue?: string;
	/** Called with the new text, not the event. */
	onValueChange?: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	/** Marks the value wrong: destructive border and focus ring, `aria-invalid`. */
	invalid?: boolean;
	name?: string;
	id?: string;
	autoComplete?: string;
	inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
	/** The field itself (layout, width). */
	className?: string;
	/** The accessible name, when no `<label>` points at it. */
	accessibilityLabel?: string;
};

export type InputSkeletonProps = { className?: string };
