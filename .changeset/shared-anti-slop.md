---
'@radandevist/radan-ui': minor
---

The shared `lint/oxlint.json` now ships the `anti-slop` OxLint plugin next to `house` (`lint/plugins/anti-slop/index.js`, pre-bundled like `house`): 15 rules that reject low-evidence patterns (chained type assertions, `unknown` parameters/returns, runtime `typeof`, `Reflect.apply/get`, module mocking, …), all at `error`. An app that extends the shared config gets them with no extra setup. `house/no-console-in-source` now also applies to `apps/<name>/src` and `packages/<name>/src` when linting from a monorepo root. The README lint section documents how an app adds its own plugins and rules on top.
