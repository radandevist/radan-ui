import type { ReactNode } from 'react';

export type PhoneTopBarProps = {
	/** The app's own classes, merged after the bar's (the desktop look of the same header). */
	className?: string;
	/** The parts: `PhoneTopBar.Menu`, `.Back`, `.Title`, `.Actions`, and whatever the app keeps in its header from md. */
	children?: ReactNode;
};

/** The navigation toggle, below md only; it hides while a page's back arrow (`data-page-back`) is mounted. */
export type PhoneTopBarMenuProps = {
	/** The accessible name (translated by the app). */
	label: string;
	onPress: () => void;
	/** The drawer's state, for `aria-expanded`. */
	expanded?: boolean;
	/** Replaces the default icon. */
	children?: ReactNode;
};

/** The page's back arrow, fixed over the bar below md (a 44 px target), leading the title from md. */
export type PhoneTopBarBackProps = {
	label: string;
	/** Runs on a tap, at most once per guard window. A returned promise that rejects is swallowed (the router reports it). */
	onBack: () => void | Promise<void>;
	/** Replaces the default icon. */
	children?: ReactNode;
};

export type PhoneTopBarTitleProps = {
	/** The path of the page on screen (never the navigation's target): the published title only counts for it. */
	path: string;
	/** What the bar shows until the page publishes its own (the server's first paint). */
	fallback: string;
	/** The section's name, shown from md instead of the page's title. */
	pageName?: string;
};

export type PhoneTopBarActionsProps = {
	/** The app's right-hand controls (bell, account…), after the slot. */
	children?: ReactNode;
};

export type PhoneTopBarActionProps = {
	/** A page's own control, portalled into the bar's slot just before the app's controls. */
	children: ReactNode;
};

export type PhoneTopBarSkeletonProps = { className?: string };

/** The title a page draws in its h1, with the path it belongs to: a pending navigation must not keep the last page's. */
export type PageTitle = { path: string; title: string };
