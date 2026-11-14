# Lint: `house/no-boolean-prop-soup`

Enforces [`composition.md`](./composition.md): a component composes its parts through `children`, it does not grow a
list of `hasThumb` / `showPill` flags. Shipped in `@radandevist/radan-ui/oxlint.json` (the `house` plugin) at **warn**.

## What it reports

In `.tsx` files, for a PascalCase component (function, arrow, `memo`, `forwardRef`, `FC<P>`, including anonymous `export default` components): more than `max` (default
**1**) props typed `boolean` (or `boolean | undefined`) whose name is a **part toggle**: `has*`, `show*`, `hide*`,
`with*`, `without*`, `no*`, `enable*`, `disable*`, or `is*` (the prefix followed by a capital letter).

```tsx
// reported: two toggles
const Card = ({ hasThumb, showPill }: { hasThumb?: boolean; showPill?: boolean }) => …;

// fine: compose the parts
<Card><Card.Thumb /><Card.Pill /></Card>
```

Not toggles: real element states (`disabled`, `open`, `checked`, `selected`, `loading`, `required`, `readOnly`,
`active`, `busy`, `invalid`, `expanded`, `pressed`) and async / pagination words (`pending`, `error`, `dirty`,
`fetching`, `submitting`, `saving`, `success`, `empty`, `more`, `next`, `previous`). An `is*` or `has*` name is state when
any camel-case word of the rest is one of them (`isOpen`, `isRemoveDialogOpen`, `isPending`, `hasNextPage`). `show*`,
`hide*`, `with*`, `without*`, `no*`, `enable*`, `disable*` are always toggles.

## What it reads

The props type comes from the first parameter, a `FC<P>` annotation, or the `forwardRef<El, P>` / `memo<P>` type
arguments, even when the wrapped component is not inline (`memo<P>(Existing)`, `const C: FC<P> = Existing`). A type literal is read as is; a name is followed **only to a same-file** `type` / `interface`, including
`extends` and `&`. An imported or otherwise unresolvable type contributes nothing, so a component whose props live
elsewhere is never reported. A prop redeclared through `extends` or `&` counts once.

## Options

```jsonc
"house/no-boolean-prop-soup": ["warn", { "max": 1, "allow": ["compact"], "layoutUnions": false }]
```

- `max` (default `1`): toggles allowed before reporting.
- `allow` (default `[]`): extra state words added to the allowlist (`isCompact` is then ignored).
- `layoutUnions` (default `false`): also report a `variant` / `layout` / `mode` prop that is a union of two or more
  layout names (`card`, `row`, `tile`, `list`, `grid`, `compact`, `full`): several components wearing one coat.

Suppress a justified exception with `// oxlint-disable-next-line house/no-boolean-prop-soup -- reason`.
