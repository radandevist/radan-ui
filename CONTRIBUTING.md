# Contributing to radan-ui

Thanks for contributing. This is a public, Apache-2.0 library: everything in the repo is read by other agents and by
other apps, so nothing private (app data, secrets, client names) belongs here.

> **Status.** The theme, the shared OxLint/oxfmt configs, the build, the Changesets release pipeline, the tokens catalog
> (<https://radandevist.github.io/radan-ui/>) and the visual regression tests are live.

## Setup

```sh
pnpm install
pnpm check
```

`pnpm check` runs, in order: `tsc --noEmit` (typecheck), `oxlint --quiet .` (lint), `oxfmt --check .` (format:check),
`vitest run` (test), the build, `publint --strict` + `attw` (check:package) and the size budget (size). CI runs the same
command on every pull request with Node 24 and the pnpm version pinned in `packageManager` (10.13.1). Use pnpm inside
this repo; the published package itself installs with npm, pnpm, yarn and bun.

## Commits and pull requests

Commit titles follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat(theme): …`,
`fix(lint): …`, `docs: …`, `ci: …`. `main` accepts squash merges only and keeps a linear history, so the PR title is
the commit title that lands. CI must be green before a merge. Every PR that changes the package — `src/`, `lint/`,
`scripts/` or `package.json` — carries a changeset; docs- and catalog-only PRs are exempt with the `no-changeset` label.
The [PR template](.github/pull_request_template.md) lists the gates.

## Code style

Tabs, 120-column lines, single quotes, arrow functions, English code, files under 300 lines. `pnpm format` applies
oxfmt; `pnpm lint` runs OxLint. The library has no i18n, no router and no data fetching: every visible string comes in
through props or children, so each app keeps its own translations.

## Changesets and releases

Every package-changing PR carries a changeset:

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

The `Changeset` workflow fails a PR that touches `src/`, `lint/`, `scripts/` or `package.json` without a newly added
`.changeset/*.md`; add the `no-changeset` label for docs/catalog-only PRs.

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

A change to a token, a component or any CSS is a visual change. Update `catalog/` so the new state is visible in light
and dark, at 390×844 and 1440×900, and attach the Playwright captures to the PR. `pnpm test:visual` compares against
the committed baselines; a deliberate change needs updated baselines reviewed alongside the diff, never a weakened
assertion. The baselines are rendered by the CI runner (local fonts differ): run the `Visual baselines` workflow
(Actions, manual dispatch) or take the `*-actual.png` files from a failed CI run's `visual-report` artifact, and commit
them under `catalog/tests/__screenshots__/`.
