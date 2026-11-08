# Shared UI library (ShopKartOS + PublyApp + future apps) — design

Status: APPROVED by Radan, 2026-11-08. Brainstormed with Radan in the ShopKartOS captain session.

Amended 2026-11-08: the library also targets **React Native (Expo)** with the same component API — see
[Cross-platform components (web + React Native)](2026-11-08-cross-platform-native-design.md), which changes decisions
1, 3, 5 and 7 below (listed at the end of that file). Where the two disagree, the addendum wins.

## Why

ShopKartOS and PublyApp have the same visual language; PublyApp's redesign copied ShopKartOS. Today every look, rule
and component lives twice, and Radan must describe the same thing again in another session to get it in the other app.
Goal: **describe once, every app has it** — today's two apps and the next ones.

## What Radan asked for (his decisions)

- A new project starts with everything ready on day one:
  1. **His code style**: front-end rules and React practices (composition, Compound Components, …) and the OxLint/oxfmt
     rules that enforce them.
  2. **His visual style**: the CSS — colours, radii, shadows, type, motion, light/dark.
  3. **Ready-to-use components.**
  4. The written rules the agents read, so no session needs him to repeat anything.
- **One base everywhere**: the same yellow, black, white and greys in every app.
- **Everything overridable** (an escape hatch): a project, a kind of component, or a single surface (a card, a button)
  can take another value without copying the component.
- **Consistency is non-negotiable**; **composition + Compound Components everywhere** (rules of 2026-11-08).
- **ShopKartOS is the visual reference** (the most advanced); PublyApp's redesign is well under way too.
- "Just do it": Radan hands the remaining choices to the captain.

## Current state (recon 2026-11-08)

- Same stack in both apps: React 19, Tailwind 4.3.3, Base UI 1.8/1.9, TanStack Start/Router/Query/Table, sonner,
  Tabler icons, cva, tailwind-merge, i18next, zod, OxLint 1.8x + oxfmt, TypeScript 7.
- Colours diverged slightly: PublyApp `--publy-primary #fdc700`, ShopKartOS `#fecd00`; backgrounds/greys differ; only
  1 of 18 shared semantic tokens has the same value. Same radius scale.
- PublyApp has the stronger engineering: ~35 `components/ui/*` with tests, `DESIGN.md` (392 lines), CSS contrast
  guards, a monorepo with an OxLint JS-plugin package (`packages/lint-ts`). ShopKartOS has 18 `components/ui/*`, its
  richer pieces live in `features/*`, and it uses Motion (PublyApp does not).

## Decisions (captain's calls — Radan can override any)

1. **One PUBLIC GitHub repo, one package** (Radan's question 2026-11-08; PublyApp is already public, Apache-2.0):
   `radandevist/radan-ui`, package `@radandevist/radan-ui`, licence Apache-2.0 like PublyApp, PUBLISHED ON NPM under Radan's own scope as `@radandevist/radan-ui` (npm user
   `radandevist`, who already publishes `dokploy-from-source`) and installed like any package
   (`npm i @radandevist/radan-ui@^0.1.0`). The CSS prefix default stays `radan-ui`. Public means no token on the prod server or
   in CI, and anyone can install it. Rule that follows: nothing private in the repo (no app data, no secrets, no client
   names). Subpath exports:
   - `radan-ui/theme.css` — tokens + Tailwind v4 `@theme`, light and dark;
   - `radan-ui` — the React components (TypeScript source, compiled by each app's Vite; Tailwind scans it via `@source`);
   - `radan-ui/oxlint` (a shareable `.oxlintrc.json` + the JS plugins) and `radan-ui/oxfmt` (the shared `.oxfmtrc.json`);
   - `docs/` — the rules the agents read (see 6).
   A monorepo of several packages is not needed for one consumer type; split later only if a package needs its own
   release pace.
2. **Every CSS variable is prefixed, the prefix configurable, default `radan-ui`** (Radan, 2026-11-08):
   `--radan-ui-yellow-500`, `--radan-ui-card-bg`… CSS cannot rename a variable at runtime, so the prefix is chosen when
   the theme file is generated: the package ships `theme.css` with the default prefix and a tiny generator
   (`npx radan-ui theme --prefix acme > src/styles/ui-theme.css`) for another one. Components never spell the prefix:
   they use Tailwind utilities (`bg-card`, `rounded-card`…) whose `@theme` entries point at the prefixed variables, so
   a new prefix needs no component change. Tailwind's own `--color-*`/`--radius-*` names stay as Tailwind requires.
   **Tokens in three layers**, each overridable by plain CSS after the import:
   - *palette*: `--radan-ui-yellow-500`, `--radan-ui-gray-*`, … — the one base (values from ShopKartOS);
   - *semantic*: `--radan-ui-background`, `--radan-ui-primary`, … (shadcn meanings, mapped to the usual Tailwind names
     `bg-background`, `bg-primary`… so the apps' classes do not change) pointing at the palette;
   - *component*: `--radan-ui-card-bg`, `--radan-ui-card-radius`, `--radan-ui-button-bg`, `--radan-ui-toast-radius`, … pointing at the semantic layer.
   Escape hatch: a project overrides a layer in its own CSS; one surface overrides with `className` or a `style`
   variable. An override is a named, documented exception, never a per-page variant (consistency rule).
3. **Components are presentational and Compound** (`Card.Header`, `Card.Body`, `Skeleton.Card`, `Tabs.List`…), built
   on Base UI, with their skeleton beside them. **No i18n inside the library**: every visible string comes in through
   props/children, so each app keeps its own translations. No data fetching, no router import.
4. **Source of each component**: the look from ShopKartOS, the tests/guards/docs from PublyApp when they are better.
   For each component the captain puts both versions side by side (mobile/desktop, light/dark), picks, and only asks
   Radan when in doubt.
5. **A small catalog app** (`playground/`, Vite) renders every component in every state, light and dark. It is the
   review surface for side-by-side captures and the proof page for each PR. Not Storybook (one more toolchain).
6. **The rules travel with the library**: `docs/` holds the visual language (from PublyApp's `DESIGN.md`, values
   aligned on ShopKartOS) and the front-end rules (consistency, composition/Compound Components, mobile-native, forms in
   a drawer, one appear/disappear animation, skeletons). Each app's `AGENTS.md` links them
   (`node_modules/radan-ui/docs/…`) instead of keeping its own copy; app-specific rules stay in the app.
7. **Release and maintenance like a serious open-source library** (Radan, 2026-11-08: "la crème de la crème", others
   may install it):
   - **Semver**, strictly: patch = fix, minor = new component/prop/token, major = anything that changes an existing
     look, prop, token name or export. While 0.x, a breaking change is a minor bump and says so in the notes.
   - **Changesets**: every PR that changes the package carries a `.changeset/*.md` (bump type + the user-facing note);
     CI fails without one (docs/catalog-only PRs exempt).
   - **Release workflow (GitHub Actions)**: on `main`, the Changesets action opens/updates a "Version packages" PR
     (bumped `package.json`, `CHANGELOG.md`); merging it publishes to npm with **provenance via npm Trusted Publishing
     (OIDC, no long-lived npm token)**, pushes the `vX.Y.Z` tag and creates the **GitHub Release** with the notes.
   - **Release notes** grouped (Breaking / Features / Fixes / Deprecations), each line with the PR link, a migration
     snippet for every breaking change, and before/after captures from the catalog for visual changes.
   - **Deprecation policy**: a prop/component/token is deprecated for at least one minor release (console warning in
     dev + note) before removal in the next major.
   - **CI gates on every PR**: oxlint, oxfmt check, typecheck, unit tests (Vitest + jsdom), build, package checks
     (`publint` + `@arethetypeswrong/cli`), bundle size budget (size-limit), visual regression of the catalog
     (Playwright screenshots, light/dark, mobile/desktop), dependency audit.
   - **Build for any consumer**: ESM + `.d.ts` built with tsdown (not raw TS source), CSS shipped as files, `sideEffects`
     limited to the CSS, React/Base UI/Tailwind/Motion as peer dependencies with tested ranges.
   - **Repo hygiene**: README (install, theme, prefix, overrides, one example), CONTRIBUTING, CODE_OF_CONDUCT,
     SECURITY.md (private vulnerability reporting on), issue/PR templates, Renovate for dependency updates, branch
     protection on `main` (PR + green CI), Conventional Commits.
   - **Public docs**: the catalog deployed to GitHub Pages on each release (the living documentation, one page per
     component with its states, props and skeleton).
   - **A maintenance skill** (`radan-ui-maintainer`, in `~/.claude/skills` and the repo's `.ai/`): how to add a
     component, write a changeset, review a release PR, cut a major, deprecate, hotfix a published version, and bump the
     apps (one PR per app, never both at once).

## Version 1 contents (captain's call)

- `theme.css` (the 3 layers, light/dark) + the shared OxLint/oxfmt config and the generic rules of both apps' plugins.
- Components: Button, Card, Badge/Pill (status tones), Tabs/SegmentedTabs, Input/Textarea/Select/Switch/Checkbox/Label,
  Drawer/FormPanel (right drawer from md, bottom sheet below), Toaster (option K), StatCard + IndicatorsGrid,
  Collapse (+ the motion presets), the Skeleton library (from ShopKartOS PR "skeleton convention").
- Docs as in 6. Catalog as in 5.

## Rollout

1. Create the repo with the release machinery FIRST (CI, Changesets, Trusted Publishing, hygiene files, skill); then
   theme + lint config + docs + catalog; publish v0.1.0.
2. Move the v1 components one by one (ShopKartOS look, PublyApp tests), each with catalog captures.
3. ShopKartOS consumes v0.x first (it is the reference: lowest risk of visual change), page by page; then PublyApp.
4. Each app then deletes its local copies; a guard test in each app fails if a library component is re-implemented
   locally (`components/ui/*` names that the library exports).

## Non-goals / anti-goals

- No copy-paste distribution (shadcn-style "copy into the app"): it brings the drift back.
- No per-app fork of a component; an app needing something new adds it to the library.
- Failure even if it "works": an app that looks different after migrating, or a rule an agent can only learn by Radan
  repeating it.

## Left to the builder

Folder layout inside the repo, the test runner setup (Vitest + jsdom like PublyApp), the catalog's routing, the exact
token names beyond the examples above.
