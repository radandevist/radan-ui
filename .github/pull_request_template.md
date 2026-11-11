## What

Closes #

Describe the change in one or two sentences. Every PR closes an issue: open one first.

## Why

Explain the problem this solves for consumers of the library, not just for this repo.

## Checklist

- [ ] `pnpm check` is green (typecheck, OxLint, oxfmt, Vitest, build, package checks, size budget).
- [ ] A changeset is added under `.changeset/`, or the PR carries the `no-changeset` label (docs/catalog only).
- [ ] `README.md` and `docs/` are updated when behaviour, tokens or the public API change.
- [ ] The diff contains no private data, secrets, tokens, logs or client names.
- [ ] The PR title is a Conventional Commit (`feat(theme): …`, `fix: …`, `docs: …`); `main` squashes with that title.
- [ ] Visual change: `apps/catalog/` shows the new state, `pnpm catalog:build && pnpm test:visual` is green with reviewed baselines, and the
      before/after captures are attached (see CONTRIBUTING, Visual changes).
