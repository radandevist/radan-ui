# radan-ui

Theme, React components and lint rules shared by Radan's apps — one visual language, described once.

[![CI](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@radandevist/radan-ui.svg)](https://www.npmjs.com/package/@radandevist/radan-ui)

> **Status: published on npm, `0.x`.** The current version is on the npm badge above; before `1.0` a minor release may
> change the API (see `CHANGELOG.md`). Components arrive in phase 2.

## What it ships

- **Theme** — the tokens, `generateThemeCss({ prefix })`, `theme.css` and `theme.native.css` (follows the system
  dark mode), and the `radan-ui theme [--prefix <p>] [--native]` CLI.
- **Components** — `Button` (web and React Native), more in phase 2.
- **React Native / Expo** — `withRadanUi` for `metro.config.js`.
- **Lint** — the shared `oxlint.json` / `oxfmt.json` and the `house` rules.
- **Docs** — `docs/DESIGN.md` (the visual language) and `docs/rules/` (the binding front-end rules), shipped inside the
  package.
- **Catalog** — <https://radandevist.github.io/radan-ui/>, rebuilt on each push to `main` (`apps/catalog/`).

To work on the library: clone the repo, `pnpm install`, then `pnpm check` (see `CONTRIBUTING.md`).

Licensed under Apache-2.0. See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md` before opening a PR or a
vulnerability report.

## Usage

### Install

```sh
npm i @radandevist/radan-ui
pnpm add @radandevist/radan-ui
yarn add @radandevist/radan-ui
bun add @radandevist/radan-ui
```

The package is ESM, needs Node 22 or newer, and installs with npm, pnpm, yarn (node-modules and pnp) or bun alike —
CI installs the packed tarball with all of them. Only this repository uses pnpm as its package manager.

### Theme

Import the theme right after Tailwind, then add `.dark` on `<html>` for dark mode:

```css
@import 'tailwindcss';
@import '@radandevist/radan-ui/theme.css';

@custom-variant dark (&:is(.dark *));
```

```html
<html class="dark">
	<!-- … -->
</html>
```

The theme defines three layers of CSS variables, all prefixed `--radan-ui-*`: raw palette colours, semantic colours
(`--radan-ui-background`, `--radan-ui-primary`, …) and component knobs (`--radan-ui-card-radius`, …). Tailwind
utilities such as `bg-background`, `bg-primary`, `rounded-card` and `shadow-raised-control` read them through
`@theme inline`, so components never spell the prefix.

### Custom prefix

Generate the same theme under another prefix — lowercase letters, digits and dashes, starting with a letter:

```sh
npx @radandevist/radan-ui theme --prefix acme > src/styles/ui-theme.css
```

Inside this repo, run the built bin directly: `pnpm build && node packages/radan-ui/dist/cli.js theme --prefix acme`. `npx` needs the
scoped package name, otherwise it resolves the unrelated unscoped package. Import the generated file instead of `theme.css`; Tailwind utility
names stay the same.
The same generator is available in JavaScript as `generateThemeCss({ prefix })`. For React Native / Expo, `radan-ui theme --native` (or `generateThemeCss({ native: true })`) adds the system dark `@media (prefers-color-scheme: dark)` block.

### Overrides

Redefine any variable after the import: a whole layer for a project, or one knob for one surface.

```css
@import '@radandevist/radan-ui/theme.css';

:root {
	--radan-ui-card-radius: 16px;
	--radan-ui-primary: #ff6b00;
}

.my-card {
	--radan-ui-card-radius: 4px;
}
```

An override is a named, documented exception, never a per-page variant — consistency is the point of the library.

### React Native / Expo

Same tokens, NativeWind v5. Import the **native** theme: it is `theme.css` plus a `@media (prefers-color-scheme: dark)` block, so the app follows the system theme (`theme.css` stays dark-only-with-`.dark`, for the web). Tailwind skips `node_modules`, so point `@source` at the native build:

```css
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import 'tailwindcss/utilities.css';
@import 'nativewind/theme';
@import '@radandevist/radan-ui/theme.native.css';

@source './node_modules/@radandevist/radan-ui/dist/native';
```

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withRadanUi } = require('@radandevist/radan-ui/metro');

module.exports = withRadanUi(getDefaultConfig(__dirname));
```

`withRadanUi(config, options?)` is `withNativewind(config, { inlineVariables: false, inlineRem: 16, ...options })`: the first keeps every `--radan-ui-*` variable overridable at runtime, the second makes `rem` 16px like the web.

### Lint

`pnpm check` runs, in order, TypeScript (`tsc --noEmit`), OxLint, oxfmt, the Vitest suite, the build, `publint` +
`attw` (`check:package`) and the size budget; CI runs the same command on every pull request. The repo's own
configuration lives in `.oxlintrc.json` and `.oxfmtrc.json` (tabs, 120 columns, single quotes), and `.oxlintrc.json`
extends the shared one.

A consuming app gets the shared rules — including the generic `house` plugin and the `anti-slop` plugin (15 rules that
reject low-evidence patterns: `as unknown as`, `unknown` parameters/returns, runtime `typeof`, module mocking, …), both
shipped pre-bundled as plain JS — by extending the installed config. OxLint treats `extends` entries as filesystem paths (not package specifiers) and
resolves the plugin path relative to the shared file, so point it at the installed file and do not list `jsPlugins`
yourself:

```json
{
	"extends": ["./node_modules/@radandevist/radan-ui/lint/oxlint.json"]
}
```

#### Adding your own plugins and rules

Keep the `extends` above and add your own `jsPlugins` and `rules` next to it: OxLint merges them with the shared ones, so
the app keeps `house/*` and `anti-slop/*`. Plugin specifiers in your file resolve relative to your file. Examples of what
the apps layer on top (rules too specific to share): ShopKartOS's `no-db-write-in-loop` (database writes inside loops) and PublyApp's `publy/*`
rules (dayjs, lodash imports, route preloads, …), each in a plugin of the app's own:

```jsonc
{
	"extends": ["./node_modules/@radandevist/radan-ui/lint/oxlint.json"],
	"jsPlugins": [
		{ "name": "shop", "specifier": "./tools/oxlint/shop/index.ts" }, // e.g. shop/no-db-write-in-loop
		{ "name": "publy", "specifier": "@org/lint-ts/publy" } // e.g. publy/no-direct-dayjs-in-components
	],
	"rules": {
		"shop/no-db-write-in-loop": "error",
		"publy/no-direct-dayjs-in-components": "error",
		"anti-slop/no-object-parameters": "off" // tighten or relax a shared rule here
	}
}
```

Plugin names must be unique, so an app plugin cannot also be called `house` or `anti-slop`: use your own name (the
`shop/…` rule above was `house/no-db-write-in-loop` while vendored). Type-aware rules need `"options": { "typeAware": true }`
in your own file.

Format with the shared oxfmt config:

```sh
oxfmt -c node_modules/@radandevist/radan-ui/lint/oxfmt.json
```

### Docs and catalog

- `docs/DESIGN.md` — the visual language: tokens, light/dark, density, radius, shadows, status tones, motion,
  accessibility.
- `docs/rules/` — the binding front-end rules; an app links their index `docs/rules/README.md` once from its `AGENTS.md`.
- The tokens catalog, deployed to <https://radandevist.github.io/radan-ui/> on each push to `main`; `apps/catalog/` holds
  its source and the visual regression baselines.
