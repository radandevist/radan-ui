# Cross-platform components (web + React Native) — design addendum

Status: DIRECTION DECIDED by Radan, 2026-11-08 (PublyApp session); mechanism = builder's calls below, Radan can
override any. Amends the approved [shared UI library design](2026-11-08-shared-ui-library-design.md), decisions 1, 3, 5
and 7 (see "What changes in the main spec").

## Why

PublyApp gets an Android app, and it must look like the web app. Radan's choices:

- **React Native + Expo** for mobile (iOS later; Android first).
- **NativeWind** (Tailwind on React Native) so the same utility classes and tokens drive both platforms.
- **The same component API on web and mobile** — one signature, so a screen is described once.
- **In this library**, not in a PublyApp-only `packages/ui`: every app (PublyApp, ShopKartOS, the next ones) gets
  native components the same way it gets web ones.

The web components are built on Base UI, which renders DOM only. So the API is shared, the implementation is not:
**one contract per component, one implementation per platform, one import path that resolves per platform.**

## Timing

The repo is at the bootstrap step (Phase 1, Task 1). Nothing below changes Phase 1's scope; it only fixes two shapes
before they are built (the token data and the export map), so that native support is additive later instead of a
breaking rework.

## Decisions (builder's calls — Radan can override any)

### 1. One import path, resolved per platform

Every component is a **subpath export** with platform conditions:

```json
"exports": {
	"./button": {
		"react-native": { "types": "./dist/native/button.d.ts", "default": "./dist/native/button.js" },
		"default": { "types": "./dist/web/button.d.ts", "default": "./dist/web/button.js" }
	}
}
```

```ts
// Identical line in a TanStack Start app and in an Expo app
import { Button } from '@radandevist/radan-ui/button';
```

- **Metro** (React Native) matches the `react-native` condition on every platform, and package `exports` are on by
  default since React Native 0.79 (Expo SDK 53). **Vite** never asserts `react-native`, so it takes `default`.
- **TypeScript**: the Expo app sets `"customConditions": ["react-native"]` (with `moduleResolution: "bundler"`) and sees
  the native types; the web app needs nothing.
- **Why subpaths, not one `"."` barrel**: Metro does not tree-shake by default, so a barrel puts every component in
  every native bundle; per-component entries keep native bundles small and are fine for Vite too. The root `"."` stays
  the Node-side JS API (`generateThemeCss`, tokens) — no React in it.
- **Why not `radan-ui/web` + `radan-ui/mobile`**: a shared composite (a status badge built from `Badge`) could only
  import one of them and would be written twice. One path lets shared code run on both.
- The export map is **generated** by the build from `src/components/*` (one entry per component), and a test fails if a
  component folder has no entry or an entry points at a missing file.

### 2. A contract per component

```
src/components/button/
	button.contract.ts   — the public API: props types (and compound parts), no runtime code
	button.variants.ts   — the shared cva definition (base classes, variants, sizes)
	button.web.tsx       — Base UI implementation
	button.native.tsx    — rn-primitives / React Native implementation
	button.skeleton.web.tsx, button.skeleton.native.tsx — the skeleton beside it (main spec §3)
```

```ts
// button.contract.ts
import type { ReactNode } from 'react';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon';

export type ButtonProps = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	onPress?: () => void;
	className?: string;
	children?: ReactNode;
};
```

- Both implementations are typed by the contract (`export const Button = (props: ButtonProps) => …`), so a renamed
  prop or a dropped variant fails the typecheck of the platform that drifted.
- **Compound components are part of the contract** (`Card.Header`, `Tabs.List`, …): the contract declares the parts
  and each platform provides all of them.
- **The contract never exposes the underlying library**: no Base UI `render` prop, no Radix-style `asChild`, no DOM or
  React Native prop types. Composition goes through the library's own compound parts.
- **Events use one vocabulary**: `onPress` (activation by touch, click or keyboard); the web implementation maps it to
  `onClick`. Value inputs use `value` / `onValueChange` and toggles `checked` / `onCheckedChange` — the names Base UI
  and rn-primitives already share.
- **Escape hatch on both platforms = `className`** (NativeWind reads it on native) and the token variables (main spec
  §2). `style` is not in the contract: its type differs per platform.
- **No platform-only props in v1.** A need on one platform is either generic (→ goes in the contract, implemented on
  both) or a sign the pattern differs (→ decision 5). Revisit only with a concrete case.

### 3. One look: tokens and variants shared

- **Tokens stay data** (`src/theme/tokens.ts`, Phase 1 Task 2). From the same data the build emits:
  - `dist/theme.css` for the web (unchanged);
  - the NativeWind theme for native. NativeWind v5 is built on Tailwind CSS v4 and reads the `@theme` mapping plus
    the `:root` variables, so the target is **the same generated file, or a sibling generated from the same data**
    if the spike (decision 9) shows a construct NativeWind does not support;
  - `resolveTokens(mode)` in the JS API — resolved values for what classes cannot reach on native (status bar,
    navigation theme, charts).
- **Dark mode on native** follows the system or the app's toggle (`useColorScheme` + NativeWind's variable context);
  on the web it stays the `.dark` class. Both read the same light/dark values from the token data. Spike result:
  `.dark {}` works on native only as a wrapper class (a variable scope) and never reads the system scheme, and
  `:root.dark` is a compile error on native; so the generator also emits
  `@media (prefers-color-scheme: dark) { :root { … } }` for "follow the system" (Phase 2).
- **Native build options** (spike result, [report](../spikes/2026-11-11-native-spike.md)): react-native-css must run with
  `inlineVariables: false` (by default a variable declared once is inlined and cannot be overridden at runtime, which
  breaks the override mechanism of the main spec §2) and `inlineRem: 16` (default 14 makes radii and spacing smaller
  than on the web). The app's CSS also needs `@source` on `node_modules/@radandevist/radan-ui/dist/native`, since
  Tailwind v4 does not scan `node_modules`. Shipped as a documented `withRadanUi(config)` helper or README snippet.
- **Variants are shared**: `button.variants.ts` holds one `cva` whose classes are valid on both platforms. Each
  implementation adds its platform states on top: web `hover:` / `focus-visible:`, native `active:` (pressed).
  A class that only one platform understands never goes in the shared variants file (a guard checks for `hover:`,
  `focus-visible:`, `group-hover:` and arbitrary `color-mix(...)` values there).
- **The hairline ring** (`shadow-raised-control` = `0 0 0 1px border`) maps to React Native's `boxShadow` (New
  Architecture) or, failing that, a 1px border — the "flat surface, crisp hairline" look is kept either way.

### 4. Primitives

- **Web**: Base UI, as in the main spec.
- **Native**: **rn-primitives** (headless, accessible, compound primitives for React Native: Dialog, Select, Tabs,
  Checkbox, …) styled with NativeWind. **react-native-reusables** (shadcn for React Native) is a starting point for the
  implementations — copied into this library and reshaped to the contracts, never distributed to apps (the main
  spec's anti-goal against copy-paste distribution still holds).
- Lists use FlashList on native.

### 5. Same contract, different rendering where the pattern differs

Desktop patterns do not all fit a phone. When the pattern differs, the **contract and the data model are shared** and
each platform renders its own pattern:

| Contract | Web | Native |
|---|---|---|
| `Drawer` / `FormPanel` | right drawer from `md`, bottom sheet below (main spec) | always a bottom sheet |
| `DataTable` (later) | table, sticky header, contained scroll | FlashList of rows/cards from column `meta` hints |
| `Menu` | dropdown on click | action sheet / long-press |
| `Tooltip` | hover/focus hint | omitted or long-press (documented per component) |

`DataTable` takes TanStack Table column definitions (headless, runs on both). Columns carry hints in `meta`
(`primary`, `secondary`, `badge`, `hideOnNative`); the web renders columns, native renders a row whose title is the
`primary` column, a status pill from `badge`, a subtitle from `secondary`.

### 6. Dependencies

- `react` is a required peer.
- Web-only peers (`@base-ui/react`, …) and native-only peers (`react-native`, `nativewind`, `react-native-css`,
  `@rn-primitives/*`, `react-native-reanimated`, `@shopify/flash-list`) are peers marked **optional** in
  `peerDependenciesMeta`, so a web app installs no React Native packages and an Expo app installs no Base UI.
- Native files import only native peers and web files only web peers; a guard checks it (an import of
  `@base-ui/react` in a `*.native.tsx`, or of `react-native` in a `*.web.tsx`, fails).

### 7. Build

- tsdown runs twice: web entries (`*.web.tsx` → `dist/web/<component>.js` + `.d.ts`) and native entries
  (`*.native.tsx` → `dist/native/<component>.js` + `.d.ts`); `theme.css` and the native theme as in decision 3.
- The native output is plain ESM JavaScript (no TypeScript, no JSX left) so Metro consumes it from `node_modules`
  without app-side configuration beyond NativeWind's own setup.
- `publint` and `attw` run on the nested conditions (Phase 1 Task 4 already has them).

### 8. Tests and catalog

- **Typecheck twice**: `tsconfig.web.json` and `tsconfig.native.json` (`customConditions: ["react-native"]`, React
  Native types). Both run in `pnpm check`.
- **Contract conformance**: a test walks `src/components/*` and asserts each folder has `*.contract.ts`,
  `*.variants.ts`, a web and a native implementation (or is listed in `web-only.json` with a reason — see Rollout), and
  an export map entry.
- **Behaviour tests**: web with Vitest + jsdom + Testing Library (main spec). Native with **jest-expo +
  @testing-library/react-native** — Vitest does not run React Native components reliably today; this is the one place
  Jest is allowed in the repo, behind `pnpm test:native`.
- **Catalog**: the web catalog (Phase 1 Task 7) stays the reference. A small **Expo catalog** (`catalog-native/`)
  renders the same pages from the same data; captures from a low-end Android device (and an emulator in CI later) go
  in PRs that touch native code.

### 9. Spike first — the risky parts

Before the first native component, one PR proves, in `tests/fixtures/expo-consumer/` (an Expo app installing the packed
tarball, like Phase 1's consumer fixtures):

1. Metro resolves `@radandevist/radan-ui/button` to `dist/native/button.js`; Vite resolves it to `dist/web/button.js`;
   `tsc` with `customConditions` picks the native types.
2. **`className` works on library components shipped prebuilt in `node_modules`.** NativeWind v5 rewrites
   `react-native` imports in the app's code; whether it does so inside a dependency is the main unknown. If not, the
   native implementations import `View`/`Text`/`Pressable` from `react-native-css/react-native` (or register them
   with NativeWind's interop) themselves — the spike picks the form that works and documents it.
   *Result: it does, with no wrapper. `withNativewind` redirects every `react-native` import (dependencies included) to
   `react-native-css/components`; the native files keep importing plain `react-native`.*
3. The generated theme drives NativeWind: `bg-primary`, `rounded-card`, light and dark, a runtime override of one
   variable. Any construct NativeWind does not support (for example `color-mix`, `oklch`, `calc()` on radii) is listed
   and the generator gets a native output that resolves it at build time.
4. The `boxShadow` ring renders on Android (New Architecture); otherwise the 1px-border fallback.

Result: a short report in the PR and, if a decision above changes, an edit to this file in the same PR.
**Done: [spike report](../spikes/2026-11-11-native-spike.md)** (points 1-2 proven, 3 and 4 partial: one theme file kept,
two Metro options and a system-dark media block added to decision 3; the ring is not yet seen on a device).

### 10. Releases

Semver rules of the main spec §7 apply to both platforms, plus:

- A **contract change** is a change to both platforms: breaking per the main spec's rules, whatever platform asked.
- A native implementation for a component that was web-only = **minor** (new capability).
- A fix on one platform = patch; the changeset names the platform (`fix(button, native): …`).

## Rollout

1. **Phase 1 is unchanged** except two forward-compatible points (noted in the Phase 1 plan): the tokens stay data,
   separate from the CSS generator, so a native output can be added beside it — values only CSS can compute
   (`calc(var(--…))`) stay allowed, the native output resolves them at build time (Task 2); and the export map keeps
   `"."` for the JS API only, components coming later as subpaths (Task 4).
2. **Phase 2 starts with the spike** (decision 9), then Button, Badge and Input on both platforms (contract, shared
   variants, web, native, skeletons, tests, catalog pages). Then the rest of the v1 list.
3. A component may land **web first** while its native side is written: it is listed in `web-only.json` with the
   reason and the issue that tracks it; its export map entry has no `react-native` condition, so an Expo app importing
   it fails at bundle time instead of rendering the DOM version. The list must shrink: a release note mentions what
   left it.
4. PublyApp's Expo app (`apps/mobile`) is the first native consumer; ShopKartOS follows when it gets a mobile app.

## What changes in the main spec

- **Decision 1** (subpath exports): components are per-component subpaths with platform conditions
  (`@radandevist/radan-ui/button`), not one `radan-ui` entry; `"."` is the JS API.
- **Decision 3** (presentational, compound, Base UI): Base UI on the web, rn-primitives on native, behind a contract
  per component; events are `onPress` / `onValueChange`.
- **Decision 5** (catalog): plus the Expo catalog for native captures.
- **Decision 7** (CI gates, build): two typechecks, native tests behind `test:native`, two tsdown builds, optional
  platform peers, the platform-import guard.

## Non-goals

- Running the web components on native through react-native-web, or the reverse (Tamagui-style single
  implementation): it would mean dropping Base UI on the web and rebuilding the web layer and its guards.
- Pixel-identical layouts across platforms: the goal is one visual language (tokens, variants, components), with
  platform-appropriate patterns where decision 5 says so.
- A WebView wrapper (Capacitor) for the apps: same CSS, but web-in-a-WebView performance on low-end phones.
