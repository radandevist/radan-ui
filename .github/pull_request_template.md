## What

Describe the change in one or two sentences and link the issue it closes.

## Why

Explain the problem this solves for consumers of the library, not just for this repo.

## Checklist

- [ ] `pnpm check` is green (typecheck, OxLint, oxfmt, Vitest, build, package checks, size budget).
- [ ] A changeset is added under `.changeset/`, or the PR carries the `no-changeset` label (docs/catalog only).
- [ ] `README.md` and `docs/` are updated when behaviour, tokens or the public API change.
- [ ] The diff contains no private data, secrets, tokens, logs or client names.
- [ ] The PR title is a Conventional Commit (`feat(theme): …`, `fix: …`, `docs: …`); `main` squashes with that title.

## Coming later

The catalog and the visual regression tests land with Task 7 — see the
[Phase 1 plan](../docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md). Until then, visual changes need no catalog
captures and no `pnpm test:visual` run.
