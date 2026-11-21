import type { ReactNode } from 'react';

/** The card frame and its parts (header, heading, icon, label, body): `className` for layout, `children` for the content. */
export type CardProps = { className?: string; children?: ReactNode };
export type CardPartProps = CardProps;
/** The skeleton of a card is a loading region: `label` is the announced "Loading…" text, translate it in the app. */
export type CardSkeletonProps = { label?: string; className?: string; children?: ReactNode };
/** The skeleton of the heading label: `width` is a Tailwind width class (`w-24`), like a `BoneLine`'s. */
export type CardLabelSkeletonProps = { width?: string; className?: string };
export type CardIconSkeletonProps = { className?: string };
