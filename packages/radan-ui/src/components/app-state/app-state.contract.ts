import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react';

/** The four tints ShopKartOS uses, from the status palette (light and dark come with the tokens). */
export type StateTone = 'info' | 'neutral' | 'warning' | 'danger';

/** A 24-viewBox stroke icon component (Tabler, Lucide, an inline SVG): the block owns size and stroke. */
export type StateIcon = ComponentType<{ className?: string; stroke?: number }>;

export type ErrorStateProps = {
	/** `alert` for a failure (default), `status` for a state that fixes itself (offline). */
	role?: 'alert' | 'status';
} & Omit<ComponentPropsWithoutRef<'div'>, 'role'>;

export type ErrorStatePictogramProps = {
	icon: StateIcon;
	/** `info` by default: the tint is the caller's call, the pictogram is decorative. */
	tone?: StateTone;
	/** The 144 px box, not the glyph. */
	className?: string;
};

export type ErrorStateDetailsProps = { label: ReactNode; children: ReactNode; className?: string };

export type ErrorStateDescriptionProps = ComponentPropsWithoutRef<'p'>;
export type ErrorStateActionsProps = ComponentPropsWithoutRef<'div'>;

export type EmptyStateSize = 'default' | 'compact';

export type EmptyStateProps = {
	/** `default` (120 px pictogram) or `compact` (96 px, the in-card variant). */
	size?: EmptyStateSize;
} & ComponentPropsWithoutRef<'div'>;

export type EmptyStatePictogramProps = {
	icon: StateIcon;
	/** Applied to the glyph, the one documented override (the success tint today); replaces the muted default. */
	className?: string;
};

export type EmptyStateTextProps = ComponentPropsWithoutRef<'p'>;
export type EmptyStateActionsProps = ComponentPropsWithoutRef<'div'>;
