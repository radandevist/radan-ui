import type { ReactNode } from 'react';

export type SkeletonLineSize = 'xs' | 'sm' | 'md' | 'lg';

/** A region (the root, or a card): `label` is the announced "Loading…" text, translate it in the app. */
export type SkeletonRegionProps = { label?: string; className?: string; children?: ReactNode };
export type SkeletonPartProps = { className?: string; children?: ReactNode };
/** One text line: `size` sets the height, `width` is a Tailwind width class (`w-16`, `w-2/3`; default `w-full`). */
export type SkeletonLineProps = { size?: SkeletonLineSize; width?: string; className?: string };
export type SkeletonPillProps = { width?: string; className?: string };
/** A paragraph: `lines` bones, the last one shorter. */
export type SkeletonTextProps = { lines?: number; size?: SkeletonLineSize; className?: string };
export type SkeletonBoneProps = { className?: string };
