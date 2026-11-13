// ponytail: a typed stand-in so the root typecheck needs no React Native toolchain. It lists the props the native
// files use; add a name here when a component needs one (shared file: keep edits to one line per prop). The real
// check of the native files runs against React Native's own types in apps/expo-consumer (`tsc -p tsconfig.src.json`).
declare module 'react-native' {
	import type { ComponentType, ReactNode } from 'react';

	type Base = { children?: ReactNode; className?: string; testID?: string };
	type A11y = {
		accessibilityLabel?: string;
		accessibilityRole?: 'button' | 'text' | 'header' | 'link' | 'image' | 'none';
		accessibilityState?: { disabled?: boolean; busy?: boolean; selected?: boolean; checked?: boolean };
		accessibilityElementsHidden?: boolean;
		importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
	};
	export const View: ComponentType<Base & A11y>;
	export const Text: ComponentType<Base & A11y & { numberOfLines?: number }>;
	export const Pressable: ComponentType<Base & A11y & { disabled?: boolean; onPress?: () => void }>;
	export const Modal: ComponentType<Base & { visible?: boolean; transparent?: boolean; onRequestClose?: () => void }>;
	export const ScrollView: ComponentType<Base & { horizontal?: boolean; contentContainerClassName?: string }>;
	export const TextInput: ComponentType<
		Base &
			A11y & {
				value?: string;
				placeholder?: string;
				editable?: boolean;
				secureTextEntry?: boolean;
				multiline?: boolean;
				onChangeText?: (text: string) => void;
			}
	>;
	export const ActivityIndicator: ComponentType<Base & { size?: 'small' | 'large'; color?: string }>;
}

// ponytail: every rn-primitives package is `any` at the root (it needs React Native's types); the fixture checks them for real.
declare module '@rn-primitives/*';
