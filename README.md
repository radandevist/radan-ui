# radan-ui

Theme, React components and lint rules shared by Radan's apps — one visual language, described once.

[![CI](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@radandevist/radan-ui.svg)](https://www.npmjs.com/package/@radandevist/radan-ui)

> **Status: pre-release (`0.0.0`, not yet on npm).** The theme, its generator and CLI, the shared OxLint/oxfmt configs
> and the build/release machinery are in place; the design docs, the front-end rules and the tokens catalog land before
> the first publish (v0.1.0). See the [Phase 1 plan](docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md).

## What exists today

Tasks 1–5 of the [Phase 1 plan](docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md) are done.

- `package.json` with the `check`, `typecheck`, `lint`, `format`, `format:check`, `test`, `build`, `check:package`
  and `size` scripts.
- `src/theme/` — the token data, `generateThemeCss({ prefix })`, and `dist/theme.css` built with the default prefix.
- `src/cli.ts` — `radan-ui theme [--prefix <p>]`, wired as the package `bin`.
- `lint/` — the shared `oxlint.json` / `oxfmt.json` and the generic `house` rules; this repo's `.oxlintrc.json` extends
  the shared one.
- `tsdown.config.ts`, the export map, publint/attw/size budgets, and an installed-package test.
- `.changeset/` — Changesets config, the first changeset, the release workflow (npm Trusted Publishing) and the
  changeset gate; the TypeScript, OxLint, oxfmt and Vitest configs, the CI workflow, and the hygiene docs
  (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`).

Clone the repo and run `pnpm install` then `pnpm check` (see `CONTRIBUTING.md`). There is no `docs/DESIGN.md` and no
`catalog/` yet, and the package is not on npm.

Licensed under Apache-2.0. See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md` before opening a PR or a
vulnerability report.

## Usage

The package is not on npm yet: the commands below work once it is published (or against the packed tarball). The design
docs, the front-end rules and the catalog land before v0.1.0 — see the
[Phase 1 plan](docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md).

### Install (once published)

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

Inside this repo, `pnpm exec radan-ui theme --prefix acme` resolves the same bin; `npx` needs the scoped package name,
otherwise it resolves the unrelated unscoped package. Import the generated file instead of `theme.css`; Tailwind utility
names stay the same.
The same generator is available in JavaScript as `generateThemeCss({ prefix })`.

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

### Lint

`pnpm check` runs, in order, TypeScript (`tsc --noEmit`), OxLint, oxfmt, the Vitest suite, the build, `publint` +
`attw` (`check:package`) and the size budget; CI runs the same command on every pull request. The repo's own
configuration lives in `.oxlintrc.json` and `.oxfmtrc.json` (tabs, 120 columns, single quotes), and `.oxlintrc.json`
extends the shared one.

A consuming app gets the shared rules — including the generic `house` plugin, shipped pre-bundled as plain JS — by
extending the installed config. OxLint treats `extends` entries as filesystem paths (not package specifiers) and
resolves the plugin path relative to the shared file, so point it at the installed file and do not list `jsPlugins`
yourself:

```json
{
	"extends": ["./node_modules/@radandevist/radan-ui/lint/oxlint.json"]
}
```

Format with the shared oxfmt config:

```sh
oxfmt -c node_modules/@radandevist/radan-ui/lint/oxfmt.json
```

### Docs and catalog

- `docs/DESIGN.md` — the visual language: tokens, light/dark, density, radius, shadows, status tones, motion,
  accessibility.
- `docs/rules/` — the binding front-end rules, linked from a consuming app's `AGENTS.md`.
- The tokens catalog will be deployed to <https://radandevist.github.io/radan-ui/> on each release; `catalog/` will
  hold its source and the visual regression baselines.
