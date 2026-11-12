# anti-slop (vendored)

Generic Oxlint rules that reject low-evidence and low-signal implementation patterns. Shipped pre-built as
`index.js` (see `tsdown.lint.config.ts`) and enabled by `lint/oxlint.json`.

- **Source:** [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) @ `6d53855` (MIT, upstream)
- **Modifications:** formatting only. The ShopKartOS and PublyApp vendored copies were byte-identical rule by rule, so
  this is the single merged copy. PublyApp's opt-in `anti-slop-effect` plugin (`no-service-constructor-imports`) is
  Effect-specific and stays in PublyApp.
- Tests: `tests/lint-plugin/anti-slop/`. This directory is excluded from the repo's own lint (vendored code).
