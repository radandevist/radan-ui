import type { Nav, TransitionStyle } from './page-transition.contract';
import { appliedStyle, readStyle, STORAGE_KEY } from './page-transition.style';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * `<html data-motion>`, the one attribute every surface reads to decide how it moves: `ios | material | none` (`auto`
 * resolved by the platform, reduced motion resolved to `none`). The library owns it: nobody else writes it.
 */
export const applyMotion = (style?: TransitionStyle, nav?: Nav) => {
	if (globalThis.document) {
		// A document without `matchMedia` (a webview, a test DOM) cannot ask: it plays the style.
		const reduced = globalThis.matchMedia instanceof Function && matchMedia(REDUCED_MOTION_QUERY).matches;
		// Reduced motion plays as `none`: the same variables, so surfaces and JS timers agree.
		document.documentElement.dataset.motion = reduced ? 'none' : appliedStyle(style ?? readStyle(), nav);
	}
};

/** Re-applies the stored style (a swapped document emptied <html>'s attributes). */
export const applyStoredMotion = () => applyMotion(readStyle());

/**
 * `appliedStyle(readStyle())` for a document with nothing loaded yet. SELF-CONTAINED on purpose (no module reference,
 * no helper): `MOTION_SCRIPT` is its `toString()`, so a test proves the two agree instead of two copies drifting apart.
 */
const resolveMotion = (key: string, reduced: string) => {
	try {
		let style = localStorage.getItem(key);
		if (style !== 'ios' && style !== 'material' && style !== 'none') {
			const nav: { userAgent?: string; userAgentData?: { platform?: string } } = navigator;
			const platform = nav.userAgentData?.platform || '';
			style = /android/i.test(platform) || (!platform && /android/i.test(nav.userAgent || '')) ? 'material' : 'ios';
		}
		document.documentElement.dataset.motion = matchMedia(reduced).matches ? 'none' : style;
	} catch {
		// Storage blocked or no matchMedia: the attribute stays unset and the CSS falls back to its neutral values.
	}
};

/** Inline in the document head (see `MotionScript`): `data-motion` is there before the first paint, same rule as `appliedStyle`. */
export const MOTION_SCRIPT = `(${resolveMotion.toString()})(${JSON.stringify(STORAGE_KEY)},${JSON.stringify(REDUCED_MOTION_QUERY)})`;
