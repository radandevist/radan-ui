## What

Describe the change in one or two sentences and link the issue it closes.

## Why

Explain the problem this solves for consumers of the library, not just for this repo.

## Checklist

- [ ] `pnpm check` is green (typecheck, OxLint, oxfmt, Vitest).
- [ ] A changeset is added under `.changeset/`, or the PR carries the `no-changeset` label (docs/catalog only).
- [ ] Visual changes carry catalog captures (light/dark, 390×844 and 1440×900) and reviewed baseline updates.
- [ ] `README.md` and `docs/` are updated when behaviour, tokens or the public API change.
- [ ] The diff contains no private data, secrets, tokens, logs or client names.
- [ ] The PR title is a Conventional Commit (`feat(theme): …`, `fix: …`, `docs: …`); `main` squashes with that title.
