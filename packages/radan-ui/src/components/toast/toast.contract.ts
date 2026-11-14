import type { ToasterProps as SonnerToasterProps } from 'sonner';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

/** The small uppercase word over each toast's title, per type. The library has no i18n: the app translates them. */
export type ToasterLabels = Record<ToastType, string>;

/**
 * The public API of the `<Toaster />` (render it once, near the root); toasts themselves are fired with `toast`.
 * Everything else sonner's `<Toaster>` takes passes through (`duration`, `dir`, `hotkey`, `position`, `offset`,
 * `expand`, `visibleToasts`, `className`, …), except what the card owns. No `closeButton`: the apps' rule is no visible ✕
 * (a toast closes by timeout, swipe or its action), so it is not offered.
 */
export type ToasterProps = Omit<
	SonnerToasterProps,
	'icons' | 'style' | 'toastOptions' | 'theme' | 'containerAriaLabel' | 'closeButton'
> & {
	/** The label of each type (« DONE » for `success`, …). */
	labels: ToasterLabels;
	/** The accessible name of the notifications region ("Notifications"); sonner appends its hotkey (`alt+T`). */
	containerAriaLabel: string;
	/** The time shown at the top right of every card ("now"); translate it in the app. Nothing is shown when omitted. */
	now?: string;
	/** The app's theme, never the OS's (default `light`). */
	theme?: 'light' | 'dark';
};

export type ToastSkeletonProps = {
	/** The announced "Loading…" text, translate it in the app. */
	label?: string;
	className?: string;
};
