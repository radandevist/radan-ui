import type { ReactNode } from 'react';

/** The card surface, and its header and body rows: `className` for layout, `children` for the content. */
export type CardProps = { className?: string; children?: ReactNode };
export type CardPartProps = CardProps;
/** The skeleton of a card is a loading region: `label` is the announced "Loading…" text, translate it in the app. */
export type CardSkeletonProps = { label?: string; className?: string; children?: ReactNode };
