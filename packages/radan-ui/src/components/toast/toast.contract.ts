export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

/** The small uppercase word over each toast's title, per type. The library has no i18n: the app translates them. */
export type ToasterLabels = Record<ToastType, string>;

/** The public API of the `<Toaster />` (render it once, near the root); toasts themselves are fired with `toast`. */
export type ToasterProps = {
	/** The label of each type (« DONE » for `success`, …). */
	labels: ToasterLabels;
	/** The time shown at the top right of every card ("now"); translate it in the app. Nothing is shown when omitted. */
	now?: string;
	/** The app's theme, never the OS's (default `light`). */
	theme?: 'light' | 'dark';
	/** Keep the whole stack open instead of folding it behind the front card (default: folded, opens on hover). */
	expand?: boolean;
	/** How many cards show at once (default 3). */
	visibleToasts?: number;
	/** The toaster's root element. */
	className?: string;
};

export type ToastSkeletonProps = { className?: string };
