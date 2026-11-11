# radan-ui maintainer runbook

Package `@radandevist/radan-ui` (public, Apache-2.0). Repo `radandevist/radan-ui`. Monorepo (pnpm + Turborepo): the package lives in `packages/radan-ui/`, the catalog in `apps/catalog/`, the Expo fixture
in `apps/expo-consumer/` (npm, outside the workspace). Use pnpm inside this repo. Run
`pnpm check` before every push (typecheck, lint, format, test, build, publint/attw, size).

**Status (when written):** `packages/radan-ui/src/` holds the theme, the CLI and the public entry `src/index.ts`; the shared OxLint /
oxfmt config lives in `packages/radan-ui/lint/`. The catalog (`apps/catalog/`, `pnpm catalog:build`, `pnpm test:visual`, `pages.yml`) is
phase 1 task 7; components (`packages/radan-ui/src/components/`) are phase 2. The "add a component" steps describe the intended layout;
adjust to what is on `main` and fix this file when it lands.

## Publishing facts

- Publish = `release.yml` on every push to `main`, via npm **Trusted Publishing** (OIDC, provenance). No npm token
  anywhere. The npm package requires 2FA and disallows tokens: never `npm publish` by hand (except the one-time v0.1.0).
- Flow: PR with a changeset -> merge -> the `changesets/action` opens/updates the `chore: version packages` PR ->
  merge it -> CI publishes, tags `vX.Y.Z`, creates the GitHub release.
- The publish runs from `packages/radan-ui/` (changesets). Its `prepack` script copies the root `docs/`, `README.md` and
  `LICENSE` in so the tarball keeps shipping them (gitignored copies, removed by `postpack`). `CHANGELOG.md` lives in the package.
- Gotchas (all hit for real):
  - PRs opened by the GitHub Actions bot (the Version packages PR) do **not** trigger CI. Close and reopen the PR to run it.
  - An **empty changeset** (frontmatter only, no bump) blocks publishing. Never commit one; delete it.
  - The release job pins `npm i -g npm@11`: npm 12 rejects the `--no-git-checks` flag changesets passes.
  - The workflow uses `changesets/action@v2`. v1 could not read changesets CLI v3 output, so no tag / GitHub release was
    created (0.1.1 was released by hand). Do not downgrade.

## Add a component

1. Branch: `git switch -c feat/<name> origin/main`.
2. Folder `packages/radan-ui/src/components/<name>/` (files < 300 lines, tabs, single quotes): `<name>.tsx` with compound parts
   (`Card`, `Card.Header`, ...), `<name>-skeleton.tsx` **beside it** (same layout, tokens `bg-foreground/10` + pulse),
   `index.ts`. No i18n, no router, no fetching: strings come from props/children. Visuals use theme tokens only.
3. Export from `src/index.ts`. Add tokens (if any) to `src/theme/` and rebuild: `pnpm --filter @radandevist/radan-ui build:theme`.
4. Tests beside it (`<name>.test.tsx`, Vitest): render, variants, a11y roles, skeleton matches the real component.
5. Catalog page `apps/catalog/<name>-page.tsx` (all states, light + dark), registered in `apps/catalog/main.tsx`.
6. `pnpm check`, then (first time on a machine) `pnpm --filter catalog exec playwright install --with-deps chromium`, then
   `pnpm catalog:build && pnpm test:visual`; attach captures to the PR.
7. Changeset **minor** (see below). PR title `feat(<name>): ...`.

## Write a changeset

```sh
npx changeset        # pick the bump, write the note
```

Bump rules (spec §7): **patch** = a fix; **minor** = new component, prop or token; **major** = anything that changes an
existing look, prop, token name or export. While `0.x`, a breaking change is a **minor** and says "Breaking" in the note.

Wording: for users, not reviewers; one line, imperative, what they can now do or must change. Breaking notes add a
migration snippet:

````md
---
'@radandevist/radan-ui': minor
---

Breaking: rename the `tone` prop of `Badge` to `variant`.

```diff
- <Badge tone="success" />
+ <Badge variant="success" />
```
````

The `Changeset` check fails PRs touching `packages/radan-ui/{src,lint,scripts}/` or its `package.json` without a **new**
`.changeset/*.md`. Docs/catalog/`.ai/` only: add the `no-changeset` label. The gate only checks that a changeset file
exists: an **empty** changeset (no bump line) passes it but blocks the release later — always write the bump line.

## Review a "Version packages" PR

Branch `changeset-release/main`, title `chore: version packages`.

1. Close and reopen the PR so CI runs (bot PRs do not trigger it); wait for green.
2. `packages/radan-ui/package.json` version matches the highest bump of the pending changesets (`ls .changeset/*.md`; 0.x breaking = minor).
3. `packages/radan-ui/CHANGELOG.md` diff reads well: grouped, user-facing lines, each links its PR, breaking ones carry a migration snippet.
   Fix wording by editing the changeset files on `main` (a new PR), not this PR.
4. Visual changes: before/after captures exist on the source PRs (or the catalog diff); deliberate baseline updates only.
5. No empty changeset left in `.changeset/`. Merge (squash). Then verify:
   `npm view @radandevist/radan-ui version`, `git ls-remote --tags origin`, the GitHub release exists, and
   `npm view @radandevist/radan-ui@X.Y.Z dist.attestations` is non-empty.

## Cut a major

1. List deprecations to remove: `grep -rn "deprecated" packages/radan-ui/src docs` and past CHANGELOG "Deprecations".
2. Remove them in PRs with `major` changesets, each with a migration snippet.
3. Write a migration guide (`docs/guides/migrate-vN.md`, ships with the package) and link it in the release notes.
4. Merge, review the Version packages PR as above, then bump both apps one at a time (below).

## Deprecate

Keep the old prop/component/token working for **at least one minor**: a dev-only `console.warn` (guard with
`process.env.NODE_ENV !== 'production'`) naming the replacement, a JSDoc `@deprecated`, a catalog note, and a changeset
(minor) whose text starts with `Deprecated:` (the changelog groups by Major / Minor / Patch, not by deprecation).
Removal only in the next major.

## Hotfix a published version

```sh
git fetch --tags
git switch -c fix/<x> vX.Y.Z      # branch from the tag
# fix, then:
npx changeset                      # patch
pnpm check
```

Open the PR against `main` if X.Y.Z is the latest line (normal flow). For an older line, push the branch
`release/X.Y` (create it from the tag) and target the PR there; `release.yml` only listens on `main`, so add that branch
to its `on.push.branches` in the same PR, and only do this when really needed (Security supports the latest minor only).
A broken published version: ship the patch, then
`npm deprecate @radandevist/radan-ui@X.Y.Z "broken: use X.Y.Z+1"` (needs your npm 2FA; never `npm unpublish`).

## Bump the apps

One PR per app, never both in one go; ShopKartOS first (reference), PublyApp after it is green.

- ShopKartOS (npm today): `git switch -c chore/radan-ui-X.Y.Z origin/<base>`, `npm i @radandevist/radan-ui@X.Y.Z`.
- PublyApp: follow its repo's package manager and base branch (read its `CLAUDE.md`/CONTRIBUTING; never touch
  `develop` directly).
- Read the CHANGELOG between the old and new version; apply every migration snippet.
- Run the app's verify command and the visual captures for every screen that uses a changed component; attach them to the PR.
- Do not touch the other app until this PR is merged.

## Security report

1. Report arrives as a private advisory (Security tab -> "Report a vulnerability"); acknowledge within 7 days.
2. Fix in the advisory's private fork/branch or a private branch; patch changeset; `pnpm check`.
3. Merge, review and merge the Version packages PR; confirm the patched version is on npm with provenance.
4. Publish the advisory (credit the reporter unless they decline), bump the apps in their own PRs.
