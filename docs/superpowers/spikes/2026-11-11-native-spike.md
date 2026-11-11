# Native spike (cross-platform spec, decision 9) — 2026-11-11

Branch `spike/native`, issue [#22](https://github.com/radandevist/radan-ui/issues/22). Stack tried: Expo SDK 58.0.23, React Native 0.88.1
(New Architecture only), React 19.3.0, NativeWind `5.0.0-rc.1` + react-native-css `3.1.0-rc.1` (exact pair; the NativeWind
v5 docs page still names rc.0 and SDK 57), Tailwind 4.1.12, lightningcss 1.30.1 (the versions the docs pin).

Everything below ran headless on Linux. **No device or emulator render was done**: whatever says "style" below is the
style object react-native-css hands to React Native, not pixels.

Reproduce: `scripts/spike-native.sh` (builds, packs, installs the tarball into `tests/fixtures/expo-consumer`, runs
`npm run verify` then `npm test`). Not wired into CI: the fixture is ~710 MB of `node_modules` (about 35 s with a warm npm
cache, a few minutes cold), so it stays a manual script.

## Verdicts

| # | Point | Verdict |
|---|---|---|
| 1 | One import path resolves per tool (Metro, Vite, tsc) | **PROVEN** |
| 2 | `className` works on a prebuilt library in `node_modules` | **PROVEN** (no interop wrapper needed) |
| 3 | The generated theme drives NativeWind | **PARTIAL**: works with two Metro options and one gap (system dark) |
| 4 | The `boxShadow` ring | **PARTIAL**: style output proven, real rendering NOT PROVEN |

## 1. Resolution — PROVEN

`node scripts/verify.mjs` in the fixture (after installing the packed tarball):

```
ok metro android      ok metro ios      ok vite      ok tsc
```

- **Metro** (`npx expo export --platform android|ios --no-bytecode --no-minify`): the bundle contains the native Button
  (`accessibilityRole: "button"`, class `active:opacity-80`) and not the web one (`focus-visible:ring-2` absent). Both
  platforms, 1148 modules.
- **Vite 8** (`build({ lib })` from the fixture root, importing `@radandevist/radan-ui/button`): output contains the web
  class string `focus-visible:ring-2`, no `active:opacity-80`.
- **tsc 7** `moduleResolution: Bundler` + `customConditions: ["react-native"]`: `--traceResolution` prints
  `Matched 'exports' condition 'react-native'` … `target './dist/native/button.d.ts'`; `--explainFiles` lists only
  `dist/native/button.d.ts`. With `--customConditions default` it lists `dist/web/button.d.ts`.
- `pnpm check:package` (publint strict + attw `esm-only`) is green with the nested conditions.

Decision: spec decisions 1, 2, 7 hold as written.

## 2. `className` on prebuilt library code — PROVEN, no change needed

The feared problem does not exist in v5: `withNativewind` sets `globalClassNamePolyfill: true`, and react-native-css'
Metro resolver rewrites **every** `react-native` import whose origin is not react-native-css itself to
`react-native-css/components` (`src/metro/resolver.ts`, `nativeResolver`). That includes `dist/native/button.js` in
`node_modules`. Evidence in the exported bundle: the Button module's `require(_dependencyMap[0])` is the
`react-native-css/components` index (getters for `Pressable`, `Text`, …), whose `Pressable` is
`useCssElement(Pressable, props, { className: "style" })`.

Runtime semantics (Jest 30 + jest-expo 58 + RN Testing Library 14, real React Native and the real react-native-css
runtime, `__tests__/button.test.tsx`, 9 tests pass): `<Button>` rendered from the packed `dist/native/button.js` gets
`backgroundColor: '#fecd00'`, `borderRadius: 14`, `paddingInline: 16`, and `className="rounded-card"` passed by the app
reaches the library's Pressable (`borderRadius: 14`). Jest has no Metro, so `jest.setup.js` re-creates the same
`react-native` redirect with `jest.mock`; the Metro-level proof is the bundle inspection above.

Findings that matter for the library:

- The library imports plain `react-native` (`Pressable`, `Text`); **no** `react-native-css/components` imports and no
  `styled()` registration. This is the shape to keep.
- A consumer that uses react-native-css without NativeWind must set `globalClassNamePolyfill: true` itself.
- Tailwind v4 does **not** scan `node_modules`: the app's CSS needs `@source './node_modules/@radandevist/radan-ui/dist/native';`
  (without it the bundle contains no `bg-primary`, `rounded-control`, … at all; I hit this first). Point it at
  `dist/native` so web-only classes (`hover:`) are not generated for native. Document it in the README.
- Types: `className` on `Pressable`/`Text`/`View` comes from `react-native-css/types`: the Expo app needs
  `nativewind-env.d.ts` (`/// <reference types="react-native-css/types" />`); the library repo has
  `src/components/native-env.d.ts` and `react-native` + `react-native-css` as devDependencies so `pnpm typecheck`
  covers the native file. (Spec decision 8's two tsconfigs are not needed yet: one program typechecks both files.)

## 3. Theme — PARTIAL

`node scripts/compile-theme.mjs [file] [--no-inline] [--json]` runs the generated `theme.css` through Tailwind (PostCSS)
and react-native-css' compiler, like Metro's transformer.

**Accepted unchanged** (checked with `probe.css`): `@theme inline` (consumed by Tailwind before the compiler sees it),
hex colours, `var()` chains, `calc(var(--radan-ui-radius) * 1.4)` on radii (resolved or evaluated at runtime),
`color-mix()` and `oklch()` (compiled: `#fecd0080`, `#ce9200`; `bg-foreground/10` becomes a runtime `colorMix`
and renders `rgba(24, 24, 27, 0.1)`), multi-layer `box-shadow` lists, the `.dark { … }` block (as a variable-scope
class), light + dark values, a runtime override.

**Dropped or rejected**:

| Construct | Behaviour | Impact |
|---|---|---|
| `color-scheme: light/dark` | dropped, warning | none (the only warning the theme itself produces; Tailwind's preflight adds ~45 more) |
| `:root.dark` (class-qualified `:root`) | **hard compile error** | the generator must never emit it; `.dark {}` as today is fine |
| `.dark` class vs the system setting | `.dark` only applies under an element carrying the class; the system scheme is not read | native needs `@media (prefers-color-scheme: dark) { :root { … } }` for "follow the system" (compiles, `vr` entry with the media condition; tested with `colorScheme.set('dark')`) |
| `hover:`, `focus-visible:` | compiled with a `h`/focus flag, only meaningful with a pointer | already banned from the shared variants file |

**Two react-native-css defaults break the library contract** and are fixed by Metro options (in the fixture's
`metro.config.js`: `withNativewind(config, { inlineVariables: false, inlineRem: 16 })`):

1. **Build-time variable inlining.** A variable declared once is inlined and its declaration removed. `--radan-ui-primary`
   has no dark value, so `bg-primary` compiled to the literal `#fecd00` and a runtime override (`vars({ '--radan-ui-primary': '#ff0000' })`
   on an ancestor) was **ignored** (test: `default inlineVariables … override is ignored`, background stays `#fecd00`).
   With `inlineVariables: false` the override works (`#ff0000`) and every class keeps `var(--radan-ui-*)`.
   The override mechanism of spec §2 therefore requires this option on native. (`inlineVariables: { exclude: [...] }`
   exists for a partial list, but then every overridable token must be listed.)
2. **`rem` is 14px on native** (web 16px): the radius token `0.625rem` gave `12.25` for `rounded-control` instead of `14`.
   `inlineRem: 16` fixes it (alternative: `:root { font-size: 16px }` in the CSS, which the compiler reads).

Dark ring: with variables kept, `.dark` wrapper gives `backgroundColor: '#1f1f23'` and the ring colour `#323234`
(light `#e3e3e3`).

**What a build-time-resolved native output would need**: nothing for the constructs above (the compiler already resolves
`calc`, `color-mix`, `oklch`). A separate native theme file is **not** needed; what is missing is (a) the
`@media (prefers-color-scheme: dark)` block for system dark mode, and (b) the Metro options above, which belong in a
documented `withRadanUi(config)` helper or in the README. `resolveTokens(mode)` stays for things classes cannot reach.

Decision: keep one generated `theme.css` for both platforms; generate the `@media (prefers-color-scheme: dark)` block in
Phase 2 (same data), document the two Metro options. Spec decision 3 edited accordingly.

## 4. boxShadow ring — PARTIAL (style proven, rendering NOT PROVEN)

- React Native 0.88.1 declares `boxShadow?: ReadonlyArray<BoxShadowValue> | string` on view styles
  (`Libraries/StyleSheet/StyleSheetTypes.js`: `{ offsetX, offsetY, color, blurRadius, spreadDistance, inset }`) and ships
  `ReactAndroid/.../uimanager/style/BoxShadow.kt`. The New Architecture is the only one from RN 0.82 on, and the
  fixture sets `newArchEnabled: true`.
- NativeWind output for `shadow-raised-control` (`0 0 0 1px var(--radan-ui-border)`): the compiled rule is
  `boxShadow: [inset, inset-ring, ring-offset, ring, tw-shadow]` and the resolved style on the Button is
  `[{"offsetX":0,"offsetY":0,"blurRadius":0,"spreadDistance":1,"color":"#e3e3e3"}]` (light) and `…"#323234"` (dark):
  a valid 1px spread ring, no `shadowColor`/`elevation` fallback is emitted.
- **Not proven**: that Android actually draws it with the button's `borderRadius` (needs an emulator or device; none
  here). Decision: keep the plan (boxShadow first, 1px `border` as fallback) and verify on the first device capture of
  Phase 2 before Button ships.

## Other findings

- `@testing-library/react-native` 14 `render` is async; `jest-expo` 58 needs Jest 30.
- `pnpm check`: green, 564 tests in 13 files.
- Not done (outside the spike): the contract-conformance / export-map / platform-import guard tests of decisions 1, 6, 8; skeletons;
  catalog pages; `rn-primitives`. The Button's web side is a plain `<button>` (Base UI is not a dependency yet).
