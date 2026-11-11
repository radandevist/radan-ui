// ponytail: a loose stand-in so the root install stays web-only (no React Native toolchain). The real check of the
// native files runs against React Native's own types in tests/fixtures/expo-consumer (`tsc -p tsconfig.src.json`).
declare module 'react-native' {
	import type { ComponentType, ReactNode } from 'react';

	type Props = { children?: ReactNode; className?: string; [prop: string]: unknown };
	export const Pressable: ComponentType<Props>;
	export const Text: ComponentType<Props>;
}
