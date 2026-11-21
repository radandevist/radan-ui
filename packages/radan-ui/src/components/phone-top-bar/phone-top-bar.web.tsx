import { useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/cn';
import { createTapGuard } from '../page-transition/page-transition.back';
import type {
	PageTitle,
	PhoneTopBarActionProps,
	PhoneTopBarActionsProps,
	PhoneTopBarBackProps,
	PhoneTopBarMenuProps,
	PhoneTopBarProps,
	PhoneTopBarTitleProps,
} from './phone-top-bar.contract';
import { HEADER_BORDER_THRESHOLD, useScrolledPast } from './phone-top-bar.scrolled';
import { PhoneTopBarSkeleton } from './phone-top-bar.skeleton.web';
import { PageTitleContext, shownPageTitle } from './phone-top-bar.title';
import {
	phoneTopBarActionsVariants,
	phoneTopBarBackdropVariants,
	phoneTopBarBackVariants,
	phoneTopBarMenuVariants,
	phoneTopBarTitleVariants,
	phoneTopBarVariants,
} from './phone-top-bar.variants';

export * from './phone-top-bar.contract';
export * from './phone-top-bar.title';

const Icon = ({ className, children }: { className: string; children: ReactNode }) => (
	<svg
		aria-hidden
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		{children}
	</svg>
);

/** Tabler's `align-left`, the reference's left-aligned lines. */
const MenuIcon = () => (
	<Icon className="size-6">
		<path d="M4 6l16 0" />
		<path d="M4 12l10 0" />
		<path d="M4 18l14 0" />
	</Icon>
);

/** Tabler's `arrow-left`. */
const ArrowIcon = () => (
	<Icon className="size-6 md:size-5">
		<path d="M5 12l14 0" />
		<path d="M5 12l6 6" />
		<path d="M5 12l6 -6" />
	</Icon>
);

/**
 * The phone top bar, as ShopKartOS draws it: the title always in the bar at its compact size, the navigation toggle on
 * the left below md (hidden on a page that declares a back: its own arrow, fixed over the bar, takes that place), then
 * the right-hand controls. Below md the header is two layers: a backdrop (the background and the scrolled border) and
 * the header's buttons above it. From md the app keeps its own controls in the same header.
 */
const PhoneTopBarRoot = ({ className, children }: PhoneTopBarProps) => {
	const scrolled = useScrolledPast(HEADER_BORDER_THRESHOLD);
	return (
		<>
			<div aria-hidden data-scrolled={scrolled || undefined} className={phoneTopBarBackdropVariants()} />
			<header className={cn(phoneTopBarVariants(), className)}>{children}</header>
		</>
	);
};

/** `PhoneTopBar.Menu`: the navigation toggle, below md only. */
const Menu = ({ label, onPress, expanded, children }: PhoneTopBarMenuProps) => (
	<button
		type="button"
		onClick={onPress}
		aria-label={label}
		aria-haspopup="dialog"
		aria-expanded={expanded}
		className={cn(phoneTopBarMenuVariants(), 'hover:bg-muted')}
	>
		{children ?? <MenuIcon />}
	</button>
);

/**
 * `PhoneTopBar.Back`: the page's back arrow. Guarded: a second tap inside the window is ignored. It only calls `onBack`
 * (usually `useGoBack(fallback)` from the router adapter); `data-page-back` lets the bar swap its menu button for it.
 */
const Back = ({ label, onBack, children }: PhoneTopBarBackProps) => {
	// Lazy init: one guard per mounted arrow, never re-created on render.
	const [guard] = useState(() => createTapGuard());
	return (
		<button
			type="button"
			onClick={() =>
				guard(() => {
					// A rejected navigation is the router's to report; the guard frees itself.
					Promise.resolve(onBack()).catch(() => undefined);
				})
			}
			aria-label={label}
			data-page-back
			className={cn(phoneTopBarBackVariants(), 'hover:text-foreground max-md:hover:bg-muted')}
		>
			{children ?? <ArrowIcon />}
		</button>
	);
};

/** `PhoneTopBar.Title`: the page's own title once it is mounted (never guessed from the path), the fallback until then; from md the section's name. */
const Title = ({ path, fallback, pageName }: PhoneTopBarTitleProps) => {
	const { published } = useContext(PageTitleContext);
	return (
		<span className={phoneTopBarTitleVariants()}>
			<span className="max-md:hidden">{pageName}</span>
			<span className="md:hidden">{shownPageTitle(published, path, fallback)}</span>
		</span>
	);
};

// The slot's element, set by the bar when it mounts and read by the pages that fill it. One bar per document.
let slot: HTMLElement | null = null;
const slotListeners = new Set<() => void>();
const setSlot = (el: HTMLElement | null) => {
	slot = el;
	for (const listen of slotListeners) {
		listen();
	}
};
const subscribeSlot = (listen: () => void) => {
	slotListeners.add(listen);
	return () => void slotListeners.delete(listen);
};

/** `PhoneTopBar.Actions`: the slot pages fill with `PhoneTopBar.Action`, then the app's own right-hand controls. */
const Actions = ({ children }: PhoneTopBarActionsProps) => (
	<div className={phoneTopBarActionsVariants()}>
		<div ref={setSlot} className="contents" />
		{children}
	</div>
);

/**
 * `PhoneTopBar.Action`: a page's own control in the bar, just before the app's controls (below md the page has no title
 * row to carry it). The page renders it as a child; it is portalled into the slot once the bar is mounted.
 */
const Action = ({ children }: PhoneTopBarActionProps) => {
	const target = useSyncExternalStore(
		subscribeSlot,
		() => slot,
		() => null,
	);
	return target && createPortal(children, target);
};

/** The page-title slot's provider: wrap the shell (the bar and the pages) in it. */
export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
	const [published, setPublished] = useState<PageTitle>();
	const value = useMemo(() => ({ published, publish: setPublished }), [published]);
	return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
};

export const PhoneTopBar = Object.assign(PhoneTopBarRoot, {
	Menu,
	Back,
	Title,
	Actions,
	Action,
	Skeleton: PhoneTopBarSkeleton,
});
