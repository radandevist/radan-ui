---
'@radandevist/radan-ui': minor
---

Add the `house/no-boolean-prop-soup` lint rule (shipped in `lint/oxlint.json` at `warn`): it reports a component whose props type has more than `max` (default 1) boolean part-toggle props (`hasX`, `showY`, `hideZ`, `withX`, `noX`, `enableX`, `disableX`, `isX` that is not a real state like `isOpen`), enforcing `docs/rules/composition.md`. Only same-file props types are resolved; an imported props type is never reported. Options: `max`, `allow` (extra real states), `layoutUnions` (off by default, reports `variant` / `layout` / `mode` unions of layout names).
