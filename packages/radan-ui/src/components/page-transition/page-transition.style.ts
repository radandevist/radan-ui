import type { AppliedStyle, Nav, TransitionStyle } from './page-transition.contract';

/** The per-device style: what is stored, how `auto` resolves, and the platform tests that depend on it. */
export const TRANSITION_STYLES: readonly TransitionStyle[] = ['auto', 'ios', 'material', 'none'];
export const DEFAULT_STYLE: TransitionStyle = 'auto';
export const STORAGE_KEY = 'radan-ui:page-transition';
export type Store = Pick<Storage, 'getItem' | 'setItem'>;

const isStyle = (value: string | null): value is TransitionStyle => TRANSITION_STYLES.some((s) => s === value);

/** The style chosen on this device; the default when nothing valid is stored or storage is blocked. */
export const readStyle = (storage?: Store): TransitionStyle => {
	try {
		const value = (storage ?? localStorage).getItem(STORAGE_KEY);
		return isStyle(value) ? value : DEFAULT_STYLE;
	} catch {
		return DEFAULT_STYLE;
	}
};

/** The platform's style: Android -> material; iPhone, iPad (also an iPadOS reporting as a touch Mac), desktop, unknown -> ios. */
export const platformStyle = (nav: Nav | undefined = globalThis.navigator): AppliedStyle => {
	const platform = nav?.userAgentData?.platform ?? '';
	return /android/i.test(platform) || (!platform && /android/i.test(nav?.userAgent ?? '')) ? 'material' : 'ios';
};

/** The style that really plays: the chosen one, `auto` resolved by the platform. */
export const appliedStyle = (style: TransitionStyle, nav?: Nav): AppliedStyle =>
	style === 'auto' ? platformStyle(nav) : style;

/** Whether the platform is iOS or iPadOS (an iPad asking for the desktop site reports a Mac user agent with touch points). */
export const isIOS = (nav: Nav | undefined = globalThis.navigator): boolean =>
	/iPhone|iPad|iPod/.test(nav?.userAgent ?? '') ||
	(/Macintosh/.test(nav?.userAgent ?? '') && (nav?.maxTouchPoints ?? 0) > 1);
