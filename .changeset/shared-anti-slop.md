---
'@radandevist/radan-ui': minor
---

**Upgrade impact: 15 new rules at `error`.** The shared `lint/oxlint.json` now loads the `anti-slop` OxLint plugin next to `house` (`lint/plugins/anti-slop/index.js`, pre-bundled like `house`). An app that extends the shared config gets, on upgrade, `anti-slop/no-chained-type-assertions`, `no-conditional-empty-object-spread`, `no-known-value-widening`, `no-module-mocking`, `no-object-parameters`, `no-reflect-apply`, `no-reflect-get`, `no-runtime-typeof`, `no-shape-in-symbol-names`, `no-unknown-parameters`, `no-unknown-returns`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-widen-then-assert` and `require-safety-comment-for-type-assertion`, all `error`: existing code may start failing lint. Turn one off in your own `.oxlintrc.json` after the `extends`: `"rules": { "anti-slop/no-object-parameters": "off" }` (or `"warn"` to migrate gradually); for a single line use `// oxlint-disable-next-line anti-slop/<rule> -- reason`.

Also: `house/no-console-in-source` now applies to `apps/<name>/src` and `packages/<name>/src` when linting from a monorepo root. The README lint section documents how an app adds its own plugins and rules on top.
