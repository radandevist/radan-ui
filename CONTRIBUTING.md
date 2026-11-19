# Contributing to radan-ui

Thanks for contributing. This is a public, Apache-2.0 library: everything in the repo is read by other agents and by
other apps, so nothing private (app data, secrets, client names) belongs here.

> **Status.** Published on npm (`0.x`). Live: the theme (web and React Native), `Button`, the Expo `withRadanUi`
> helper, the shared OxLint/oxfmt configs, the Changesets release pipeline, the tokens catalog
> (<https://radandevist.github.io/radan-ui/>) and the visual regression tests. The component foundation (generated exports, guards, catalog pages) is in; Phase 2 continues the component set.

## Layout

A pnpm + Turborepo monorepo:

- `packages/radan-ui/` — the published package `@radandevist/radan-ui` (`src/theme`, `src/components`, `lint/`, `metro.cjs`, tsdown configs, its tests).
- `apps/catalog/` — the catalog (Vite; one page per component in `pages/`), its Playwright visual tests and baselines.
- `apps/expo-consumer/` — the npm-based Expo fixture (outside the pnpm workspace; run `scripts/spike-native.sh`).
- `docs/`, `README.md`, `LICENSE` at the root; `prepack` copies them into the package so the tarball still ships them.

## Setup

```sh
pnpm install
pnpm check
```

`pnpm check` runs, in order (the package tasks go through `turbo`): `tsc --noEmit` (typecheck), `oxlint --quiet .` (lint), `oxfmt --check .` (format:check),
`vitest run` (test), the build, `publint --strict` + `attw` (check:package) and the size budget (size). CI runs the same
command on every pull request with Node 24 and the pnpm version pinned in `packageManager` (10.13.1). Use pnpm inside
this repo; the published package itself installs with npm, pnpm, yarn and bun.

## Commits and pull requests

Commit titles follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat(theme): …`,
`fix(lint): …`, `docs: …`, `ci: …`. `main` accepts squash merges only and keeps a linear history, so the PR title is
the commit title that lands. CI must be green before a merge. Every PR that changes the package —
any file under `packages/radan-ui/` `src/**`, `lint/**` or `scripts/**`, or its `package.json`, `*.config.ts` or `tsconfig*.json` — carries a changeset; a change to a shipped root doc (`docs/`, `README.md`, `LICENSE`) users should see carries a patch changeset too; only catalog-only PRs skip it with the `no-changeset` label.
The [PR template](.github/pull_request_template.md) lists the gates.

## Adding a component

Everything a component needs lives in its own folder plus three satellite files, so parallel agents never edit the
same file. Nothing is registered anywhere: the export map (one `./*` pattern in `package.json`), the tsdown entries,
the guards, the catalog and the visual tests all discover `src/components/<name>/` by themselves. Copy `button` (the
model: every file below exists there).

1. **Branch** `feat/<name>` from `origin/main`.
2. **Create `packages/radan-ui/src/components/<name>/`** (lower-case folder, it becomes `@radandevist/radan-ui/<name>`):
   - `<name>.contract.ts` — the props types (and the compound parts), no runtime code, no Base UI / React Native types.
   - `<name>.variants.ts` — the shared `cva`; classes valid on both platforms. **No** `hover:`, `focus-visible:`,
     `group-hover:` or `color-mix(`: those go in the platform file.
   - `<name>.web.tsx` — Base UI (or a plain element when Base UI adds nothing); the entry of `dist/web/<name>.js`.
     Re-export the types and the skeleton from it.
   - `<name>.native.tsx` — React Native / `@rn-primitives/*`; the entry of `dist/native/<name>.js`. Same re-exports.
   - `<name>.skeleton.web.tsx` and `<name>.skeleton.native.tsx` — the skeleton beside it ([skeletons rule](docs/rules/skeletons.md)).
   - `<name>.web.test.tsx` — Vitest, `// @vitest-environment jsdom` on the first line, Testing Library: every variant,
     the states, a11y roles, `onPress`, the skeleton.
   - Web only for now? Skip the two native files and add `"<name>": { "reason": "…", "issue": "https://github.com/radandevist/radan-ui/issues/N" }`
     to `src/components/web-only.json` (the one JSON file shared with sibling agents: one entry, own line).
   - Imports: web files never import `react-native`, `nativewind`, `react-native-*` or `@rn-primitives/*`; native files
     never import `@base-ui/*`; shared files import neither. Class merging always goes through `cn` from `../../lib/cn`.
3. **Native test**: `apps/expo-consumer/__tests__/<name>.test.tsx` (jest-expo + Testing Library; copy `button.test.tsx`
   for the CSS set-up). It runs against the installed tarball: `bash scripts/spike-native.sh` (first run installs ~900 MB).
4. **Catalog page**: `apps/catalog/pages/<name>.page.tsx`, default export = the page (copy `button.page.tsx`): every
   variant, size and state, no randomness or clocks. It is auto-listed at `/?page=<name>` and gets four visual tests
   (light/dark × phone 390×844 / desktop 1440×900) from `apps/catalog/tests/pages.spec.ts`.
5. **Changeset**: `.changeset/<name>-component.md`, bump `minor`, one file per component (never edit another's).
6. **Gates**: `pnpm check`; `pnpm catalog:build`; `pnpm test:visual --update-snapshots=none --grep "<name> page"`
   (pixel diffs on other pages and a missing baseline for yours are expected locally, the fonts differ); the native
   test above. `pnpm check` fails if a file of step 2 or the catalog page is missing, if a platform import crosses over,
   or if the shared variants carry a web-only state.
7. **Baselines come from CI, never from your machine**: do not commit locally rendered PNGs. Push, open the PR (it is
   red on the `visual` job until the baselines exist), then
   `gh workflow run visual-baselines.yml --ref feat/<name> -R radandevist/radan-ui`, wait for it,
   `gh run download <run-id> -n visual-baselines -D /tmp/baselines`, copy **only** `<name>-*.png` into
   `apps/catalog/tests/__screenshots__/`, commit them, push. Look at the four images before asking for the merge.

**Files you must not touch** (shared by every component, a change needs the owner): `packages/radan-ui/package.json`
(exports, peers, dependencies), `pnpm-lock.yaml`, `tsdown.config.ts`, `vitest.config.ts`, `scripts/components.ts`,
`tests/components.test.ts`, `apps/catalog/main.tsx`, `apps/catalog/tests/pages.spec.ts`, `apps/expo-consumer/package.json`,
`src/index.ts` (it is the Node-side JS API; components are never exported from it), another component's folder, page or
changeset. A component needing a new dependency or a new token is a question for the owner, not an edit.

**Shared files you may edit with care** (small, append-only, one line each, to keep merges trivial):
`src/components/web-only.json`; `src/components/react-native-shim.d.ts` (a React Native export or prop your native
file uses that it does not list yet; the real check is `apps/expo-consumer`'s `tsc -p tsconfig.src.json`);
`src/theme/tokens.ts` (a token your component truly needs: say so in the PR).

**Avoiding conflicts**: each component is its own folder, its own catalog page, its own changeset, its own baselines;
merge order does not matter. If `main` moved, `git rebase origin/main`; a conflict in a shared file above means two
lines landed together: keep both.

## Code style

Tabs, 120-column lines, single quotes, arrow functions, English code, files under 300 lines. `pnpm format` applies
oxfmt; `pnpm lint` runs OxLint. The library has no i18n, no router and no data fetching: every visible string comes in
through props or children, so each app keeps its own translations.

## Changesets and releases

Every PR that changes what is published carries a changeset:

```sh
npx changeset
```

Pick the bump type and write the note for users, not for reviewers. A changeset is a markdown file in `.changeset/`
with frontmatter naming the package:

```md
---
'@radandevist/radan-ui': minor
---

Add the toast-radius token to the component layer.
```

The `Changeset` workflow fails a PR that touches any file under `packages/radan-ui/src/**`, `packages/radan-ui/lint/**` or
`packages/radan-ui/scripts/**`, `packages/radan-ui/package.json`, `packages/radan-ui/*.config.ts` or `packages/radan-ui/tsconfig*.json` without a newly
added `.changeset/*.md`; root `docs/`, `README.md` and `LICENSE` ship in the tarball via `prepack` but are not gated:
add a patch changeset when a shipped doc changes in a way users should see (as the README refresh does); the `no-changeset` label skips the check for catalog-only PRs.

Releases are automated. The `Release` workflow runs on every push to `main`: it keeps a `chore: version packages` PR up
to date, and merging that PR publishes to npm with Trusted Publishing (OIDC, provenance) and creates the GitHub
release. No npm token lives in the repo or in CI.

### Semver rules (from v0.1.0)

Copied from the approved design spec, §7 (Radan, 2026-11-08):

- **patch** = a fix.
- **minor** = a new component, prop or token.
- **major** = anything that changes an existing look, prop, token name or export.
- While the package is `0.x`, a breaking change is a **minor** bump and says so in the release notes.
- A prop, component or token is deprecated for at least one minor release (a console warning in dev plus a note) before
  removal in the next major.
- Release notes are grouped (Breaking / Features / Fixes / Deprecations), each line links its PR, every breaking change
  carries a migration snippet, and visual changes carry before/after captures from the catalog.

## Visual changes

A change to a token, a component or any CSS is a visual change. Update the page in `apps/catalog/pages/` so the new state is visible in light
and dark, at 390×844 and 1440×900, and attach the Playwright captures to the PR. `pnpm catalog:build && pnpm test:visual` compares against
the committed baselines; a deliberate change needs updated baselines reviewed alongside the diff, never a weakened
assertion. The baselines are rendered by the CI runner (local fonts differ): run the `Visual baselines` workflow
(Actions, manual dispatch) or take the `*-actual.png` files from a failed CI run's `visual-report` artifact, and commit
them under `apps/catalog/tests/__screenshots__/`.
