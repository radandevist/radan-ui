# radan-ui

Theme, React components and lint rules shared by Radan's apps — one visual language, described once.

[![CI](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@radandevist/radan-ui.svg)](https://www.npmjs.com/package/@radandevist/radan-ui)

> **Status: published on npm, `0.x`.** The current version is on the npm badge above; before `1.0` a minor release may
> change the API (see `packages/radan-ui/CHANGELOG.md`). `Button` is shipped; phase 2 continues the component set.

## What it ships

- **Theme** — the tokens, `generateThemeCss({ prefix })`, `theme.css` and `theme.native.css` (follows the system
  dark mode), and the `radan-ui theme [--prefix <p>] [--native]` CLI.
- **Components** — `Button` and `Skeleton` (web and React Native, one `@radandevist/radan-ui/<name>` entry each); phase 2 adds the rest of the set.
- **React Native / Expo** — `withRadanUi` for `metro.config.js`.
- **Lint** — the shared `oxlint.json` / `oxfmt.json` configs and the `house` and `anti-slop` OxLint plugins.
- **Docs** — `docs/DESIGN.md` (the visual language) and `docs/rules/` (the binding front-end rules), shipped inside the
  package.
- **Catalog** — <https://radandevist.github.io/radan-ui/>, rebuilt on each push to `main` (`apps/catalog/`).

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

Component peers are optional, so install the ones for your platform. Web (the components use Base UI):

```sh
pnpm add @base-ui/react
```

React Native / Expo (NativeWind v5, plus the `@rn-primitives/*` packages of the components you use; `slot` and
`portal` are shared by most):

```sh
pnpm add nativewind react-native-css @rn-primitives/slot @rn-primitives/portal
```

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

`npx` needs the scoped package name, otherwise it resolves an unrelated unscoped package. Import the generated file
instead of `theme.css`; Tailwind utility names stay the same. The CLI is `radan-ui theme [--prefix <prefix>]
[--native]`; `--native` adds the system dark-mode block (see React Native / Expo below). The same generator is
available in JavaScript as `generateThemeCss({ prefix, native })`.

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

### Components

```tsx
import { Button } from '@radandevist/radan-ui/button';

<Button variant="outline" size="sm" loading={saving} onPress={save}>
	Save
</Button>
```

The same import resolves to the web build (a `<button>`) or, under the `react-native` condition, to the native build.
Props are identical on both: `variant` (`default` | `outline` | `secondary` | `ghost` | `destructive` | `link`),
`size` (`default` | `xs` | `sm` | `lg` | `icon`), `disabled`, `loading`, `onPress`, `className` (the button itself),
`labelClassName` (the label: on native `Text` does not inherit colour, so text utilities go here), `accessibilityLabel`
(the accessible name, needed for `size="icon"`) and `children`. `ButtonSkeleton` (`size`, `className`) is exported
beside it. On the web `onPress` is wired to the button's `onClick`. Tailwind skips
`node_modules`, so add a `@source` next to the theme import; the path is relative to that stylesheet (here
`src/styles/app.css`):

```css
@source '../../node_modules/@radandevist/radan-ui/dist/web';
```

#### Skeleton

```tsx
import { Skeleton } from '@radandevist/radan-ui/skeleton';

<Skeleton.Card>
	<Skeleton.Card.Header>
		<Skeleton.Line size="sm" width="w-16" />
		<Skeleton.Pill width="w-14" />
	</Skeleton.Card.Header>
	<Skeleton.Card.Body>
		<Skeleton.Text lines={2} size="xs" />
	</Skeleton.Card.Body>
</Skeleton.Card>
```

A compound component, one bone per real element (`docs/rules/skeletons.md`). `Skeleton` and `Skeleton.Card` are regions:
`aria-busy` plus a visually hidden "Loading…" status (`label` translates it; a region nested in another adds none), bones
are hidden from assistive tech. `Skeleton.Line` takes `size` (`xs` | `sm` | `md` | `lg`) and `width` (a Tailwind width
class), `Skeleton.Pill` a `width`, `Skeleton.Text` `lines` and `size`; every part takes `className`. The bone is
`bg-foreground/10` plus one pulse, fixed in the library.

#### Page transitions (web)

Native-feeling screen changes below `md` (iPhone cover, Material 3 shared axis, fade) on the browser's View Transitions
API, plus the back arrow that goes with them (`docs/rules/native-navigation.md`). Router-agnostic: the library marks the
direction and ships the CSS; your router only tells it where a navigation comes from and goes to.

```css
@import '@radandevist/radan-ui/page-transition.css';
```

```tsx
import { PageBack, goBack, installPageTransitions } from '@radandevist/radan-ui/page-transition';

installPageTransitions(); // once, at client boot

<PageBack label={t('back')} onBack={() => goBack({ canGoBack, back: () => history.back(), toParent: () => navigate('/') })} />;
```

- `beginPageTransition(from, to, isTopLevel?)` takes two `Place`s (`{ path, index, overlay }`: `index` is the app's own
  history position, `overlay` whether a full-screen sheet is open) and returns `'push' | 'back' | 'fade'` or `undefined`.
  When a transition will play it sets `data-page-transition` (`ios` | `material`) and `data-page-direction` on `<html>`,
  which the CSS reads, and removes them when the transition settles. Nothing plays with style `none`, from `md`, with
  reduced motion, or without the API. `directionOf`, `transitionFor`, `platformStyle`, `isIOS` are the pieces.
- The device's style (`auto` | `ios` | `material` | `none`) lives under `radan-ui:page-transition`:
  `readStyle`, `writeStyle`, `subscribeStyle`, `TRANSITION_STYLES` (the settings screen and its labels stay in the app).
- `PageBack` (`label`, `onBack`, `className`, optional icon as children) ignores a second tap within 800 ms
  (`createTapGuard`) and swallows a rejected navigation; it carries `data-page-back` so your header can swap its menu
  button for it. `goBack` goes back in history when the app has an earlier entry, else replaces with the parent.
  `PageBackSkeleton` is its silhouette. Web only for now (native uses the platform's stack navigator).

TanStack Router adapter (about ten lines, in your app, not in the library):

```ts
import { beginPageTransition, installPageTransitions, type Place } from '@radandevist/radan-ui/page-transition';

type Loc = { pathname: string; search?: { notifications?: unknown } | null; state?: { __TSR_index?: number } | null };
const placeOf = (loc: Loc): Place => ({
	path: loc.pathname,
	index: loc.state?.__TSR_index,
	overlay: loc.search?.notifications === 1,
});

installPageTransitions();
const router = createRouter({
	routeTree,
	defaultViewTransition: {
		types: ({ fromLocation, toLocation }) => {
			const direction = beginPageTransition(fromLocation && placeOf(fromLocation), placeOf(toLocation));
			return direction ? [direction] : false;
		},
	},
});
```

```tsx
// The back arrow:
const router = useRouter();
const canGoBack = useCanGoBack();
<PageBack
	label={t('back')}
	onBack={() => goBack({ canGoBack, back: () => router.history.back(), toParent: () => router.navigate({ to: '/', replace: true }) })}
/>;
```

### React Native / Expo

Same tokens, NativeWind v5 (peer dependencies: `nativewind`, `react-native`, `react-native-css`). Import the **native**
theme: it is `theme.css` plus a `@media (prefers-color-scheme: dark)` block, so the app follows the system theme
(`theme.css` stays light with `.dark` for dark, for the web). Point `@source` at the native build (relative to the stylesheet; for a `global.css` at the project root it is `./node_modules/…`):

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

`withRadanUi(config, options?)` is `withNativewind(config, { inlineVariables: false, inlineRem: 16, ...options })`: the
first keeps every `--radan-ui-*` variable overridable at runtime, the second makes `rem` 16px like the web.

### Lint

A consuming app gets the shared rules — including the generic `house` plugin and the `anti-slop` plugin (15 rules that
reject low-evidence patterns: `as unknown as`, `unknown` parameters/returns, runtime `typeof`, module mocking, …), both
shipped pre-bundled as plain JS — by extending the installed config. OxLint treats `extends` entries as filesystem
paths (not package specifiers) and
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
- `docs/rules/README.md` — the index of the binding front-end rules. An app's `AGENTS.md` points at this index
  (`node_modules/@radandevist/radan-ui/docs/rules/README.md`); it lists every rule and agents follow its links.
- The tokens catalog, deployed to <https://radandevist.github.io/radan-ui/> on each push to `main`; `apps/catalog/` holds
  its source and the visual regression baselines.

## Contributing and releases

Clone the repo, `pnpm install`, then `pnpm check` (typecheck, lint, format, tests, build, package checks, size budget);
CI runs the same on every PR. Every PR that changes the package carries a changeset (`pnpm changeset`). Merging to
`main` updates a `chore: version packages` PR; merging that PR publishes to npm through Trusted Publishing (OIDC, no
token) and creates the GitHub release. Details in `CONTRIBUTING.md`.
