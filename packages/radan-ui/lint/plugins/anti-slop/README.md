# anti-slop (vendored)

Generic Oxlint rules that reject low-evidence and low-signal implementation patterns. Shipped pre-built as
`index.js` (see `tsdown.lint.config.ts`) and enabled by `lint/oxlint.json`.

- **Source:** [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) @ `6d53855` (MIT, upstream)
- **Modifications:** formatting only. The ShopKartOS and PublyApp vendored copies were byte-identical rule by rule, so
  this is the single merged copy. PublyApp's opt-in `anti-slop-effect` plugin (`no-service-constructor-imports`) is
  Effect-specific and stays in PublyApp.
- **Local customizations** (preserve them when updating from upstream; each has a test in `tests/lint-plugin/anti-slop/rules.test.ts`):
  - `no-known-value-widening`: `Record<K, V>` is an open dictionary only when `K` is broad (`string`, `number`, `symbol`,
    `PropertyKey`, or a union of those). `Record<'a' | 'b', V>` is a closed contract and no longer reported.
  - `no-unknown-type-aliases`: also reports unions containing `unknown` and `Promise<unknown>` / `PromiseLike<unknown>`,
    like `no-unknown-returns`.
  - `no-module-mocking`: also recognizes `import vi from 'vitest'` and `import * as vi from 'vitest'` (same for `jest`).
  - `no-shape-in-symbol-names`: matches the whole word `shape` / `shapes` (camelCase, snake_case, kebab segments), not the
    substring, so `reshape` or `Shaper` pass. Looser than the copies the apps vendored (substring).
  - `shared/dictionary-types.ts` (`noUncheckedIndexedAccess` fix), plus `oxlint-disable` comments with reasons in the
    generic AST walker (`shared/lexical-type-parameters.ts`) and the option check of `no-runtime-typeof`.
- Tests: `tests/lint-plugin/anti-slop/`. The repo's own lint applies the anti-slop rules here too; only the house style rules (`curly`, `func-style`, …) are off for this directory (upstream style).
