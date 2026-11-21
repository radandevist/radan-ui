import type { ReactNode } from 'react';

/** `auto` (the default) follows the phone: Android gets Material, everything else the iPhone style. */
export type TransitionStyle = 'auto' | 'ios' | 'material' | 'none';
export type AppliedStyle = Exclude<TransitionStyle, 'auto'>;
export type Direction = 'push' | 'back' | 'fade';

/**
 * One side of a location change: its path, its position in the history stack, whether an overlay sheet is open and,
 * optionally, `screen`: an opaque label for « same pathname, another phone screen » (a `?section=` that opens a screen
 * of its own below md). Two places with the same path and the same `screen` are one screen.
 */
export type Place = { path: string; index: number | undefined; overlay: boolean; screen?: string };

/** What a top-level screen is (a section of the menu). It gets the whole place, so a screen label can make it deeper. */
export type TopLevel = (place: Pick<Place, 'path' | 'screen'>) => boolean;

/** How the navigation happened: a history traversal (back/forward button, `history.back()`), or the arrow's fallback to the parent. */
export type Via = { traversal?: boolean; toParent?: boolean };

/** What the platform tells about itself (`navigator`, or a stand-in in tests). */
export type Nav = { userAgent?: string; maxTouchPoints?: number; userAgentData?: { platform?: string } };

export type Environment = { style: AppliedStyle; fromMd: boolean; reducedMotion: boolean; supported: boolean };

/** The public API of the back arrow. Router-agnostic: the app decides what going back means. */
export type PageBackProps = {
	/** The accessible name (translated by the app). */
	label: string;
	/** Runs on a tap, at most once per guard window. A returned promise that rejects is swallowed (the router reports it). */
	onBack: () => void | Promise<void>;
	/** The button itself (position, surface). */
	className?: string;
	/** Replaces the default arrow. */
	children?: ReactNode;
};

export type PageBackSkeletonProps = { className?: string };
