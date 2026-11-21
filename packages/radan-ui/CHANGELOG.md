# @radandevist/radan-ui

## 0.14.0

### Minor Changes

- [#85](https://github.com/radandevist/radan-ui/pull/85) [`190b318`](https://github.com/radandevist/radan-ui/commit/190b3184135df58ab53dc5100507e050fb050117) Thanks [@radandevist](https://github.com/radandevist)! - New: the load guard, `@radandevist/radan-ui/load-guard` (web only, no router import, no new dependency). ShopKartOS's "a page never stays on its skeleton" nets, ported as they are.
  
  - **`watchLoad(router, now?)`**: a load pending for 15 s, or a router idle with a page still pending, is revalidated once (`router.invalidate()`); checked every 3 s, when the tab becomes visible and when the network returns. Returns what stops it.
  - **`withLoadTimeout(inner, { isLoaderCall, limitMs? })`**: a call `isLoaderCall` accepts that gets no answer in 20 s fails with `Error('load_timeout')`. The caller's abort signals are chained by hand (no `AbortSignal.any`) and a caller's own abort keeps its own error. `isLoaderCall` has **no default**: which calls are loaders is the app's decision.
  - **`isServerFnGet`**: ShopKartOS's test, a GET to `/_serverFn/` without the `x-no-load-timeout` header (`NO_LOAD_TIMEOUT`, for a GET that is an action). **`isLoadTimeout(error)`** for a query layer's retry policy. Constants `PENDING_LIMIT_MS`, `FETCH_LIMIT_MS`, `LOAD_TIMEOUT`.
  - **`installLoadGuard(router, { isLoaderCall })`**: browser only, idempotent; wraps `window.fetch`, starts `watchLoad`, returns the undo of both. The library does not touch `import.meta.hot`: in dev call `import.meta.hot?.dispose(undo)`.
  
  Presenting `load_timeout` (French or English copy, the retry button) stays in the app.

- [#84](https://github.com/radandevist/radan-ui/pull/84) [`5fc0557`](https://github.com/radandevist/radan-ui/commit/5fc05573864a4120fd52b36f8bc502989f4594d9) Thanks [@radandevist](https://github.com/radandevist)! - New: the TanStack Router adapter for the page transitions, `@radandevist/radan-ui/page-transition-tanstack-router` (web only; `@tanstack/react-router` is an optional peer, `>=1.170.45 <1.171.0`, tested on the exact 1.170.45), and the phone top bar block, `@radandevist/radan-ui/phone-top-bar`. ShopKartOS's behaviour, ported as it is.
  
  - **`createPageTransitions(options)`** returns `{ routerOptions, install(router), health() }`. Spread `routerOptions` into `createRouter` (`defaultViewTransition`, `defaultPendingMs: 0`, `defaultPendingMinMs: 300`: they travel together) and call `install(router)` after it (browser only, idempotent per router, returns what undoes it). It gives one view transition per navigation (the skeleton's swap is the navigation's transition), the skeleton from the click below `md`, and the rule that a deferred skeleton is never painted once its page committed or a newer navigation took over. State is per router, not module-level. Options: `isTopLevel`, `screenParams` (search params that make one pathname several phone screens), `overlay`.
  - **`health()`** (also on `window.__radanUiPageTransitions`): `earlyOffer` is `untested | ok | no-pending-component | shape-mismatch`. The early skeleton reads the router's private load transaction in one file, with runtime shape checks; an unexpected shape turns it off, reports `shape-mismatch` and warns once in development. A contract test runs against the real pinned router.
  - **`shownPath` / `useShownPath`, `useGoBack(fallback)`, `usePageTitle(title)`**: the page on screen (never the navigation's target), the back arrow's handler, the title a page publishes to the bar.
  - **`PhoneTopBar`** (`.Menu`, `.Back`, `.Title`, `.Actions`, `.Action`, `.Skeleton`, plus `PageTitleProvider`): ShopKartOS's phone header class for class (a parity test compares its DOM with the reference). Define `--header-title-width`. `react-dom` becomes an optional peer (the portalled action slot).
  
  Migration: none for existing imports. To adopt, replace a hand-written adapter (see the README) with `createPageTransitions`.

- [#82](https://github.com/radandevist/radan-ui/pull/82) [`31e235e`](https://github.com/radandevist/radan-ui/commit/31e235e94c5212e627845f01e3c0bfb2f35cb440) Thanks [@radandevist](https://github.com/radandevist)! - Breaking: the page-transition core (`@radandevist/radan-ui/page-transition`) takes ShopKartOS's behaviour verbatim, and gains the motion attribute. Nobody imported the 0.7 module; for a new adopter, the changes are:
  
  - **Marks**: `markAppTraversal`, `markBackToParent` and the browser listeners are ShopKartOS's. `popstate` is always listened to (and `navigate` too where the Navigation API exists, to unset a non-traversal and to learn the browser animated), a mark waits for the next transition with no expiry, and `goBack` is synchronous (it returns nothing for a back, and the parent navigation's promise as it is, with no rollback). `clearMarks` and `clearBackToParent` stay exported as no-ops; the hardened marks come back in a later release.
  - **`directionOf`**: the same-path-and-same-screen check comes before the arrow's `toParent`, so the arrow onto an identical place is `undefined`, no longer `'back'`. `Place` has an optional `screen`, and a different `screen` on the same path is a screen change (index to section a push, section to index a back, section to section a push, replaced in place none). `isTopLevel` is `({ path, screen }) => boolean` (was `(path) => boolean`), and `defaultIsTopLevel` is that shape: at most one path segment and no screen.
  - **`transitionFor('fade', …)`** is `undefined` on iPhone: switching between top-level pages is instant on iOS, and a Material fade-through (outgoing 90 ms, incoming 210 ms with a 0.92 → 1 scale) elsewhere. `page-transition.css` is ShopKartOS's file, with its durations and curves as `--radan-ui-page-*` tokens on `:root` (defaults unchanged).
  - **`guardViewTransitions`**: when `startViewTransition` throws, the fallback object has the two settled fields `{ updateCallbackDone, finished }` only. `viewTransitionRunning()` is exported.
  - **`installPageTransitions`** also applies the stored motion and follows `storage` events and the reduced-motion setting; `writeStyle` also writes the motion attribute.
  - **New**: `<html data-motion>` (`ios | material | none`, `auto` resolved by the platform, reduced motion resolved to `none`) through `applyMotion`, `applyStoredMotion`, `MOTION_SCRIPT` (derived from a function, proven equal to `appliedStyle` on the built package) and `<MotionScript nonce />` (inline script with `suppressHydrationWarning` plus the re-apply after a document swap).
  
  Migration: `goBack({ canGoBack, back, toParent })` keeps its call shape but no longer returns a promise for a back; drop an `await` you relied on to clear a mark. A custom `isTopLevel(path)` becomes `isTopLevel({ path })`.

- [#86](https://github.com/radandevist/radan-ui/pull/86) [`599b0b7`](https://github.com/radandevist/radan-ui/commit/599b0b70a8a7b04ec8a68de1584665050319c7b7) Thanks [@radandevist](https://github.com/radandevist)! - New: the QA tools, `@radandevist/radan-ui/qa` (Node only, never imported by web code). ShopKartOS's `nav-stress`, reusable, and the transition walk that makes a "no behaviour change" refactor provable. How to wire them in an app: `docs/guides/nav-stress.md`.
  
  - **`runNavStress(config)`**: fast taps (router navigate and history Back), every loader delayed, CPU 4x, then asserts what a resting app must never show: a visible skeleton, a router `idle` with a `pending` match, view-transition marks left on `<html>`, a live view transition. Config: `baseUrl`, `launch`, `login`, `routes`, `delayedRequests`, and a few knobs (`seeds`, `rounds`, `ignoreSelector`, `ua`, `taps`, `delayMs`, `screenshotDir`). Returns the runs (`stuck` rounds with a screenshot, the adapter's `earlyOffer` state); an app script maps them to exit 0 (clean) or 1 (stuck).
  - **`QaSetupError`** (exit class 2: the run could not be made, never a green run): thrown when the page exposes no `window.__TSR_ROUTER__`, or when the page transitions adapter reports `shape-mismatch` on `window.__radanUiPageTransitions`.
  - **`runTransitionWalk(config)`**: per scripted navigation (the app's `steps`), the `startViewTransition` count, direction and style, over Android/iOS user agent x Navigation API present/removed x loader delay 0/600 ms. Run it twice on the old build (identical), then on the new one (byte-identical).
  - **`restingProblems(page, { ignoreSelector })`**: the invariants alone.
  
  `playwright-core` (`>=1.60`) is an **optional peer**, imported as types only: the app passes `launch: () => chromium.launch()`. No new runtime dependency.
  
  The catalog gets a real-router demo (`router-demo.html`: TanStack Router, the adapter, the load guard, the phone top bar); radan-ui's CI runs a short fixed smoke and the walk on every PR, the full run nightly and on adapter/core PRs.
  
  Migration: none (new subpath).

## 0.13.0

### Minor Changes

- [#78](https://github.com/radandevist/radan-ui/pull/78) [`37fffee`](https://github.com/radandevist/radan-ui/commit/37fffeefa5f914a3fff205b969a983375f38da5c) Thanks [@radandevist](https://github.com/radandevist)! - Breaking: `Card` takes the ShopKartOS "double wall" shape, web and native. The frame is `bg-card` with a 4 px inset, the 14 px radius and the hairline ring; `Card.Header` is a 28 px row (`px-3 pt-1 pb-2`) holding `Card.Header.Heading` (a `Card.Header.Icon` and a `Card.Header.Label` in 12 px medium capitals) and any action after it; `Card.Body` is the inner panel (`bg-background`, 1 px `border`, `p-4`, 12 px radius), no longer a flex column with a gap. New token `--radan-ui-card-body-radius` and the `rounded-card-body` utility. `Card.Header.Label` takes `render={<h2 />}` on web (a real heading, same look) and `accessibilityRole="header"` on native. The frame no longer clips (`overflow-hidden` dropped). New parts `Card.Header.Heading`, `Card.Header.Icon`, `Card.Header.Label`, each with its `.Skeleton`; `Card.Skeleton` has the exact silhouette of the real card (no gap between header and body).

## 0.12.0

### Minor Changes

- [#73](https://github.com/radandevist/radan-ui/pull/73) [`e521ea1`](https://github.com/radandevist/radan-ui/commit/e521ea1ff313fa157606aef1b6bb130a50fc9edd) Thanks [@radandevist](https://github.com/radandevist)! - Breaking: every skeleton is now owned by its component, and the root `Skeleton` object (`@radandevist/radan-ui/skeleton`) is gone. A component carries its skeleton as a static member (`Button.Skeleton`, `Input.Skeleton`, `Toast.Skeleton`, `PageBack.Skeleton`), the generic bones are components imported one by one (`BoneLine`, `BonePill`, `BoneText`, `BoneRegion`, `Bone`), so a bundler only ships what is imported. New `Card` (web and React Native) with `Card.Header` and `Card.Body`, and `Card.Skeleton`, `Card.Header.Skeleton`, `Card.Body.Skeleton`. The look, the token (`bg-foreground/10` + one pulse) and the a11y are unchanged.
  
  | Before | After |
  | --- | --- |
  | `import { Skeleton } from '@radandevist/radan-ui/skeleton'` | one import per piece, see below |
  | `<Skeleton>` (the region) | `<BoneRegion>` from `@radandevist/radan-ui/bone-region` |
  | `<Skeleton.Card>` | `<Card.Skeleton>` from `@radandevist/radan-ui/card` |
  | `<Skeleton.Card.Header>` | `<Card.Header.Skeleton>` |
  | `<Skeleton.Card.Body>` | `<Card.Body.Skeleton>` |
  | `<Skeleton.Line>` | `<BoneLine>` from `@radandevist/radan-ui/bone-line` |
  | `<Skeleton.Pill>` | `<BonePill>` from `@radandevist/radan-ui/bone-pill` |
  | `<Skeleton.Text>` | `<BoneText>` from `@radandevist/radan-ui/bone-text` |
  | `<Skeleton.Bone>` | `<Bone>` from `@radandevist/radan-ui/bone` |
  | `<ButtonSkeleton>` | `<Button.Skeleton>` |
  | `<InputSkeleton>` | `<Input.Skeleton>` |
  | `<ToastSkeleton>` | `<Toast.Skeleton>` (`Toast` from `@radandevist/radan-ui/toast`) |
  | `<PageBackSkeleton>` | `<PageBack.Skeleton>` |
  | `SkeletonLineSize` | `BoneLineSize` |
  | `SkeletonLineProps` | `BoneLineProps` |
  | `SkeletonPillProps` | `BonePillProps` |
  | `SkeletonTextProps` | `BoneTextProps` |
  | `SkeletonBoneProps` | `BoneProps` |
  | `SkeletonRegionProps` | `BoneRegionProps` (a card skeleton: `CardSkeletonProps`) |
  | `SkeletonPartProps` | `CardPartProps` |
  
  ```diff
  - import { Skeleton } from '@radandevist/radan-ui/skeleton';
  + import { BoneLine } from '@radandevist/radan-ui/bone-line';
  + import { BonePill } from '@radandevist/radan-ui/bone-pill';
  + import { Card } from '@radandevist/radan-ui/card';
  
  - <Skeleton.Card>
  -   <Skeleton.Card.Header><Skeleton.Line width="w-16" /><Skeleton.Pill /></Skeleton.Card.Header>
  - </Skeleton.Card>
  + <Card.Skeleton>
  +   <Card.Header.Skeleton><BoneLine width="w-16" /><BonePill /></Card.Header.Skeleton>
  + </Card.Skeleton>
  ```

## 0.11.0

### Minor Changes

- [#71](https://github.com/radandevist/radan-ui/pull/71) [`c129932`](https://github.com/radandevist/radan-ui/commit/c1299329bdb6129df89cbb7d8ab00bfe8dd5ef60) Thanks [@radandevist](https://github.com/radandevist)! - Button (web): `text-*` classes in `className` now reach the label, and icons in the label are 16 px with the button's gap. Loading replaces the label icons with the spinner and blocks pointer events. Button and Input set `data-slot`. `Input` accepts `type="date"`.

## 0.10.0

### Minor Changes

- [#69](https://github.com/radandevist/radan-ui/pull/69) [`59169f5`](https://github.com/radandevist/radan-ui/commit/59169f52fc9b203df34b88740e15e57529195e3f) Thanks [@radandevist](https://github.com/radandevist)! - Breaking: `Input` takes back the ShopKartOS field look (fill `field`, 1 px border plus hairline, 12 px radius, `ring/30` halo on focus). New tokens `field`, `field-invalid`, `field-invalid-ring`, `--radan-ui-input-radius` and the `rounded-input` utility. The field text is now `foreground`.

## 0.9.0

### Minor Changes

- [#64](https://github.com/radandevist/radan-ui/pull/64) [`7f4912e`](https://github.com/radandevist/radan-ui/commit/7f4912e6bc77abf82b18333fbaf48601af0371cb) Thanks [@radandevist](https://github.com/radandevist)! - The web `Button` now takes native button props (`type="submit"`, `aria-*`, `ref`, `onClick`, `form`, ...) and Base UI's `render` (`<Button role="link" render={<a href="/x" />} nativeButton={false}>`) so it can replace an app's own button, link or menu trigger. `onPress` still works and the native `Button` is unchanged. New type `ButtonWebProps`.

### Patch Changes

- [#62](https://github.com/radandevist/radan-ui/pull/62) [`000ea62`](https://github.com/radandevist/radan-ui/commit/000ea624272a1d195d563aa4b0818a5b38910c98) Thanks [@radandevist](https://github.com/radandevist)! - Fix the invisible hover in light theme: `muted` is now `#e8e8e8` (was `#f7f7f7`, equal to `background`), so the hover of outline/ghost `Button` and `PageBack` shows on the page and on cards; `muted-foreground` goes to `#64646c` to keep 4.5:1 on it.

## 0.8.0

### Minor Changes

- [#59](https://github.com/radandevist/radan-ui/pull/59) [`c4e99bb`](https://github.com/radandevist/radan-ui/commit/c4e99bbe4f00ced0ed132bb2fd20b9febf634803) Thanks [@radandevist](https://github.com/radandevist)! - Add the `Input` field (web, with `InputSkeleton`), the `icon-xs`, `icon-sm` and `icon-lg` button sizes, the Geist font files (`@radandevist/radan-ui/fonts.css`), and a 24 px desktop offset for the toast; toast text now inherits the app's font family. `ButtonSize` gains `icon-xs`, `icon-sm` and `icon-lg`: an exhaustive `Record<ButtonSize, …>` or `switch` needs the new keys. The package licence is now `Apache-2.0 AND OFL-1.1` (the Geist font files are OFL 1.1).

## 0.7.0

### Minor Changes

- [#53](https://github.com/radandevist/radan-ui/pull/53) [`7cb82a0`](https://github.com/radandevist/radan-ui/commit/7cb82a0cdf29b3e2e6cbf69db82ef7d0c85940cf) Thanks [@radandevist](https://github.com/radandevist)! - Add the `house/no-boolean-prop-soup` lint rule (shipped in `lint/oxlint.json` at `warn`): it reports a component whose props type has more than `max` (default 1) boolean part-toggle props (`hasX`, `showY`, `hideZ`, `withX`, `noX`, `enableX`, `disableX`, `isX` that is not a real state like `isOpen`), enforcing `docs/rules/composition.md`. Only same-file props types are resolved; an imported props type is never reported. Options: `max`, `allow` (extra real states), `layoutUnions` (off by default, reports `variant` / `layout` / `mode` unions of layout names).

- [#52](https://github.com/radandevist/radan-ui/pull/52) [`c6e19b1`](https://github.com/radandevist/radan-ui/commit/c6e19b1f7e8d9a65633565be95ad9070e8bd920b) Thanks [@radandevist](https://github.com/radandevist)! - Add `page-transition` (web): native-feeling page transitions on the View Transitions API (iPhone, Material 3, fade; `@radandevist/radan-ui/page-transition.css`), router-agnostic direction marking (`beginPageTransition`, `directionOf`), the device style storage, and `PageBack` / `PageBackSkeleton` with their tap guard and `goBack`.

- [#54](https://github.com/radandevist/radan-ui/pull/54) [`bbf8c60`](https://github.com/radandevist/radan-ui/commit/bbf8c6038fb374c1a3fe84f2ab30bfbad738a9b2) Thanks [@radandevist](https://github.com/radandevist)! - Add the `Toast` component (web): `@radandevist/radan-ui/toast` exports `Toaster` (render once, with the labels and time text in your language) and sonner's `toast`. `sonner` is a new optional peer dependency. The `toast-radius` token is now 20px. Native follows in [#47](https://github.com/radandevist/radan-ui/issues/47).

## 0.6.0

### Minor Changes

- [#44](https://github.com/radandevist/radan-ui/pull/44) [`3134930`](https://github.com/radandevist/radan-ui/commit/313493058e69d6dd17f306843de160557740ec12) Thanks [@radandevist](https://github.com/radandevist)! - Add the `Skeleton` library (`@radandevist/radan-ui/skeleton`, web and React Native): a compound component (`Skeleton`, `Skeleton.Card` with `.Header` / `.Body`, `Skeleton.Line`, `Skeleton.Pill`, `Skeleton.Text`, `Skeleton.Bone`) that mirrors real content one bone per element. The region is `aria-busy` with a visually hidden "Loading…" status (`label` to translate it), bones are hidden from assistive tech. `ButtonSkeleton` now composes the same bone, its output is unchanged.

## 0.5.0

### Minor Changes

- [#40](https://github.com/radandevist/radan-ui/pull/40) [`2cd19ef`](https://github.com/radandevist/radan-ui/commit/2cd19ef9fc2141c2907105cf04890fe673dd489a) Thanks [@radandevist](https://github.com/radandevist)! - `@radandevist/radan-ui/button` is complete on web and React Native: variants `default`, `outline`, `secondary`, `ghost`, `destructive` and `link`; sizes `default`, `xs`, `sm`, `lg` and `icon`; a `loading` state (spinner, `aria-busy`, no press); `labelClassName` to style the label (on native `className` only reaches the pressable); `accessibilityLabel` for icon buttons; and a `ButtonSkeleton` exported beside it. Every component subpath (`@radandevist/radan-ui/<name>`) now resolves through one `./*` export pattern, to `dist/native` under the `react-native` condition and `dist/web` otherwise.
  
  Peer dependencies: adds `@base-ui/react` (`>=1.8.0`, web components) and `@rn-primitives/{slot,portal,dialog,select,tabs,checkbox,switch,label,collapsible}` (`>=1.5.0`, native components), **all optional**: a web app installs no React Native package and an Expo app installs no Base UI.
  
  The `link` variant label is `text-foreground` (underlined on hover on web): the primary yellow fails contrast on the light background. The component subpaths bring `class-variance-authority` and `tailwind-merge` as runtime dependencies, so theme- or CLI-only installs download them too (the `.` JS bundle does not import them).

## 0.4.0

### Minor Changes

- [#38](https://github.com/radandevist/radan-ui/pull/38) [`1b2545d`](https://github.com/radandevist/radan-ui/commit/1b2545daa141d4599eb0feb755191553361611ed) Thanks [@radandevist](https://github.com/radandevist)! - **Upgrade impact: 15 new rules at `error`.** The shared `lint/oxlint.json` now loads the `anti-slop` OxLint plugin next to `house` (`lint/plugins/anti-slop/index.js`, pre-bundled like `house`). An app that extends the shared config gets, on upgrade, `anti-slop/no-chained-type-assertions`, `no-conditional-empty-object-spread`, `no-known-value-widening`, `no-module-mocking`, `no-object-parameters`, `no-reflect-apply`, `no-reflect-get`, `no-runtime-typeof`, `no-shape-in-symbol-names`, `no-unknown-parameters`, `no-unknown-returns`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-widen-then-assert` and `require-safety-comment-for-type-assertion`, all `error`: existing code may start failing lint. Turn one off in your own `.oxlintrc.json` after the `extends`: `"rules": { "anti-slop/no-object-parameters": "off" }` (or `"warn"` to migrate gradually); for a single line use `// oxlint-disable-next-line anti-slop/<rule> -- reason`.
  
  Also: `house/no-console-in-source` now applies to `apps/<name>/src` and `packages/<name>/src` when linting from a monorepo root. The README lint section documents how an app adds its own plugins and rules on top.

- [#30](https://github.com/radandevist/radan-ui/pull/30) [`b7be023`](https://github.com/radandevist/radan-ui/commit/b7be023d71a461a0cdfe104eed6376f88c618e1d) Thanks [@radandevist](https://github.com/radandevist)! - React Native / Expo apps can follow the system light/dark setting. New `@radandevist/radan-ui/theme.native.css` is `theme.css` plus `@media (prefers-color-scheme: dark) { :root { … } }` (also `radan-ui theme --native`); `theme.css` is unchanged, so web apps that toggle `.dark` themselves are not turned dark by the OS. New `@radandevist/radan-ui/metro` exports `withRadanUi(config, options?)` for `metro.config.js`: it wraps `withNativewind` with `inlineVariables: false` and `inlineRem: 16`; `options` is passed through to `withNativewind` and overrides them. See the README « React Native / Expo » section.

### Patch Changes

- [#34](https://github.com/radandevist/radan-ui/pull/34) [`39e2f23`](https://github.com/radandevist/radan-ui/commit/39e2f23c12369846effb84f44318a7864f4fc4a9) Thanks [@radandevist](https://github.com/radandevist)! - New binding rule `docs/rules/native-navigation.md`: below `md`, a page change on the mobile web is a screen change of the whole viewport (top bar included), with push / back / fade / none. On back the leaving screen animates out over the previous screen, already shown with its content. The back arrow sits in the top bar. The style is iPhone or Material 3 by platform, and the user can override it. Exceptions are spelled out in the rule: a deep link's fallback to a never-visited parent may show its skeleton; switching between top-level sections is a fade when the app runs the navigation; on iOS a traversal the app did not start (Safari's swipe) gets no app transition.
  
  The rules index (`docs/rules/README.md`) now says to link it once from an app's `AGENTS.md` instead of each rule: an app that linked rule files one by one replaces those lines with the single index line, after which new rules arrive with the dependency bump.

- [#37](https://github.com/radandevist/radan-ui/pull/37) [`7693ca3`](https://github.com/radandevist/radan-ui/commit/7693ca33e4ea0a78fccd5f6c477bf73b88159b30) Thanks [@radandevist](https://github.com/radandevist)! - README and CONTRIBUTING brought up to date: the status no longer says « pre-release, 0.0.0, not yet on npm »; usage now covers the theme, the CLI, `Button` (web and native), `withRadanUi`, the lint configs and the docs index, plus how to contribute and how releases work.

## 0.3.0

### Minor Changes

- [#23](https://github.com/radandevist/radan-ui/pull/23) [`70970ff`](https://github.com/radandevist/radan-ui/commit/70970ffee3a380132211e129ccd577d6e7b154d8) Thanks [@radandevist](https://github.com/radandevist)! - Add an early `@radandevist/radan-ui/button` for web and React Native (behind the native spike): one import path, `react-native` condition for Expo/Metro, `default` for Vite. A conflicting `className` replaces the variant's utility (tailwind-merge, aware of `rounded-card`, `shadow-raised-control` and the theme colours).
  
  Peer dependencies: adds `react` (`>=19`), `react-native` (`>=0.81`), `nativewind` (`>=5.0.0-rc.1`) and `react-native-css` (`>=3.1.0-rc.1`), **all four marked optional** in `peerDependenciesMeta`. Only the component subpaths need them (`react` for both platforms, the other three for native), so theme/CLI-only and React 18 consumers are unaffected. New runtime dependencies: `class-variance-authority`, `tailwind-merge`.

## 0.2.0

### Minor Changes

- [#19](https://github.com/radandevist/radan-ui/pull/19) [`5ab2424`](https://github.com/radandevist/radan-ui/commit/5ab2424cba7f77eda75c5e2503dfd2cd58bf2efc) Thanks [@radandevist](https://github.com/radandevist)! - **Breaking**: the `input` semantic token now has the common shadcn/Tailwind meaning, the field outline/fill (`#e4e4e7` light, `#27272a` dark), so `border-input` and `bg-input/50` behave like shadcn. The pale outline is the deliberate default (no 3:1 raise). The old field text colour (`[#414141](https://github.com/radandevist/radan-ui/issues/414141)` light, `[#808697](https://github.com/radandevist/radan-ui/issues/808697)` dark) moves to the new bridged token `input-foreground`. `--radan-ui-input-border` still works: it is now a component token pointing at `input`. Owner decision, issue [#17](https://github.com/radandevist/radan-ui/issues/17).
  
  Migration:
  
  - `text-input` -> `text-input-foreground`
  - `border-input` used as the dark outline -> `border-input-foreground`
  - `border-[color:var(--radan-ui-input-border)]` -> `border-input` (the old variable still works; keep the arbitrary value if you override `--radan-ui-input-border`)

## 0.1.2

### Patch Changes

- [#13](https://github.com/radandevist/radan-ui/pull/13) [`ee75bc7`](https://github.com/radandevist/radan-ui/commit/ee75bc78bdd86506c7dc4e10c6ee95e00c3bee10) Thanks [@radandevist](https://github.com/radandevist)! - Fix the light-mode card text colour: the component knob `--radan-ui-card-foreground` shared the semantic token's name and pointed at itself (an invalid value in `:root`, so `text-card-foreground` was lost in light mode). The knob is now `--radan-ui-card-fg` (next to `--radan-ui-card-bg`); `--radan-ui-card-foreground` is the semantic token again. Not breaking: `--radan-ui-card-foreground` still exists (the semantic token) and `--radan-ui-card-fg` reads it, so an existing override of `--radan-ui-card-foreground` keeps working — and now actually applies in light mode.

- [#13](https://github.com/radandevist/radan-ui/pull/13) [`ee75bc7`](https://github.com/radandevist/radan-ui/commit/ee75bc78bdd86506c7dc4e10c6ee95e00c3bee10) Thanks [@radandevist](https://github.com/radandevist)! - Accessibility: the text/surface pairs the library actually draws now meet WCAG AA (4.5:1 text, 3:1 focus ring), pinned by an explicit pair list in `tests/contrast.test.ts` (both themes). Changed colours (ratio before -> after):
  
  - `muted-foreground`: light `#71717a` -> `#6b6b73`, dark `#7f7f7f` -> `[#898989](https://github.com/radandevist/radan-ui/issues/898989)` (4.32:1 on the light card, 4.1:1 on the dark card -> 4.72:1 / 4.7:1).
  - `sidebar-foreground`: same values (4.47:1 on the light sidebar, 4.42:1 on the dark one -> above 4.5:1).
  - `sidebar-ring`: light `oklch(0.705 …)` -> `#71717a` (2.43:1 on the light sidebar -> 4.47:1), dark `oklch(0.552 …)` -> `#71717a` (same colour, now a hex: 3.67:1 on the dark sidebar, unchanged).
  - `status-success` light `#15803d` -> `#157f3d` (4.48:1 -> 4.54:1 on the light card/popover).
  - `status-warning` light `#b45309` -> `#b35309` (4.49:1 -> 4.51:1 on the light card/popover).
  - `input` (field text) dark `#646a7a` -> `[#808697](https://github.com/radandevist/radan-ui/issues/808697)` (3.04:1 on the card, 3.28:1 on the background -> 4.52:1 / 4.87:1).
  - `accent-foreground` dark `paper` -> `ink` (1.79:1 on the cyan accent -> 9.88:1).

## 0.1.1

### Patch Changes

- [#6](https://github.com/radandevist/radan-ui/pull/6) [`107b7b5`](https://github.com/radandevist/radan-ui/commit/107b7b59f8dcc636c0505e33b17ae4d5a0cfa334) Thanks [@radandevist](https://github.com/radandevist)! - README: the package is published on npm; drop the stale "no docs/DESIGN.md" note.

## 0.1.0

### Minor Changes

- [#3](https://github.com/radandevist/radan-ui/pull/3) [`84df418`](https://github.com/radandevist/radan-ui/commit/84df41866b75f8bd31565cf7809b965fee67e04f) Thanks [@radandevist](https://github.com/radandevist)! - First release: the prefixed theme (`theme.css`, `generateThemeCss`, `radan-ui theme --prefix`), the shared OxLint/oxfmt
  config with the generic house rules, and the docs.
