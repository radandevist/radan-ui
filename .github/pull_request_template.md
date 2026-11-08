## What

Describe the change in one or two sentences and link the issue it closes.

## Why

Explain the problem this solves for consumers of the library, not just for this repo.

## Checklist (what applies today)

- [ ] `pnpm check` is green (typecheck, OxLint, oxfmt, Vitest).
- [ ] `README.md` and `docs/` are updated when behaviour, tokens or the public API change.
- [ ] The diff contains no private data, secrets, tokens, logs or client names.
- [ ] The PR title is a Conventional Commit (`feat(theme): …`, `fix: …`, `docs: …`); `main` squashes with that title.

## Roadmap / coming soon

These gates arrive with the release and catalog machinery — see the
[Phase 1 plan](../docs/superpowers/plans/2026-11-08-radan-ui-phase-1.md). Until then, skip them; `pnpm check` is the
only gate, so a PR needs no changeset and no catalog captures (including this bootstrap PR).

- A changeset is added under `.changeset/`, or the PR carries the `no-changeset` label (docs/catalog only) — Task 5.
- Visual changes carry catalog captures (light/dark, 390×844 and 1440×900) and reviewed baseline updates via
  `pnpm test:visual` — Task 7.
