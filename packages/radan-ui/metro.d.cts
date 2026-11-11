// Minimal local type: nativewind ships it, but it is an optional peer, so do not import it here.
export interface RadanUiMetroOptions {
	inlineVariables?: boolean;
	inlineRem?: number | false;
	[key: string]: unknown;
}
export declare function withRadanUi<T>(config: T, options?: RadanUiMetroOptions): T;
