// Minimal local type: nativewind ships it, but it is an optional peer, so do not import it here.
export interface RadanUiMetroOptions {
	inlineVariables?: boolean;
	inlineRem?: number | false;
	// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- options are passed through to nativewind untouched
	[key: string]: unknown;
}
export declare function withRadanUi<T>(config: T, options?: RadanUiMetroOptions): T;
