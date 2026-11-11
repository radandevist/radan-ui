# @radandevist/radan-ui

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
