import { useSyncExternalStore } from 'react';

/** The mobile header shows its bottom border once the page has scrolled more than this. */
export const HEADER_BORDER_THRESHOLD = 4;

/** Whether a scroll offset is past the threshold: strictly more, so exactly at it still reads as the top of the page. */
export const isScrolledPast = (scrollY: number, threshold: number): boolean => scrollY > threshold;

const subscribeScroll = (onChange: () => void) => {
	window.addEventListener('scroll', onChange, { passive: true });
	return () => window.removeEventListener('scroll', onChange);
};

/** Whether the window has scrolled past `threshold` px; false on the server (the page starts at the top). */
export const useScrolledPast = (threshold: number): boolean =>
	useSyncExternalStore(
		subscribeScroll,
		() => isScrolledPast(window.scrollY, threshold),
		() => false,
	);
