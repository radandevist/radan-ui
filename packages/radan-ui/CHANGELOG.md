# @radandevist/radan-ui

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
