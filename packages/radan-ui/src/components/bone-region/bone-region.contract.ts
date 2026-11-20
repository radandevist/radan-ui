import type { ReactNode } from 'react';

/** A loading region (a screen, a card skeleton): `label` is the announced "Loading…" text, translate it in the app. */
export type BoneRegionProps = { label?: string; className?: string; children?: ReactNode };
