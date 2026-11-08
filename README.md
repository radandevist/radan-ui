# radan-ui

Theme, React components and lint rules shared by Radan's apps — one visual language, described once.

[![CI](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/radandevist/radan-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@radandevist/radan-ui.svg)](https://www.npmjs.com/package/@radandevist/radan-ui)

> **Status: bootstrap, not yet published (`0.0.0`).** This repo currently contains only the package skeleton. The
> theme, CLI, shareable lint configs, design docs and tokens catalog are **coming soon**, before the first npm publish
> (v0.1.0): see [Roadmap / coming soon](#roadmap--coming-soon) and the
> [Phase 1 plan](docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md). Nothing in the roadmap is installable or
> runnable today — it documents the target API.

## What exists today

Task 1 of the [Phase 1 plan](docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md) is done: the repo skeleton only.

- `package.json` with the `check`, `typecheck`, `lint`, `format`, `format:check` and `test` scripts.
- `src/index.ts` exporting `DEFAULT_PREFIX = 'radan-ui'`, plus `tests/smoke.test.ts`.
- The TypeScript, OxLint, oxfmt and Vitest configs, the CI workflow, and the hygiene docs (`CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`).

Clone the repo and run `pnpm install` then `pnpm check` (see `CONTRIBUTING.md`). The package has no `exports`/`main`,
no `bin`, no `dist/`, no `lint/`, no `docs/DESIGN.md` and no `catalog/` yet, and it is not on npm.

Licensed under Apache-2.0. See `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md` before opening a PR or a
vulnerability report.

## Roadmap / coming soon

Everything in this section lands before v0.1.0 — see the
[Phase 1 plan](docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md). These are the target API and the target
behaviour, **not commands or imports you can use today**.

### Install (once published)

```sh
npm i @radandevist/radan-ui
```

The package is ESM, needs Node 22 or newer, and installs with npm, pnpm, yarn or bun alike. Only this repository uses
pnpm as its package manager.

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

`pnpm check` runs TypeScript (`tsc --noEmit`), OxLint, oxfmt and the Vitest suite; CI runs the same command on every
pull request. The repo's own configuration lives in `.oxlintrc.json` and `.oxfmtrc.json` (tabs, 120 columns, single
quotes). The library will also ship the shareable configs and the generic `house` rules under `lint/`, so a consuming
app points its OxLint/oxfmt setup at those instead of keeping a second copy.

### Docs and catalog

- `docs/DESIGN.md` — the visual language: tokens, light/dark, density, radius, shadows, status tones, motion,
  accessibility.
- `docs/rules/` — the binding front-end rules, linked from a consuming app's `AGENTS.md`.
- The tokens catalog will be deployed to <https://radandevist.github.io/radan-ui/> on each release; `catalog/` will
  hold its source and the visual regression baselines.
