# Binding rules (HARD)

Violating one fails review; a deviation needs an explicit, user-approved justification. One line each — the file
holds the rule in full.

- **Visual consistency: one language, no one-off looks** — tokens never raw values, one shared primitive per pattern,
  flat surfaces with hairline rings, overrides are named exceptions. [`visual-consistency.md`](./visual-consistency.md)
- **Composition: parts through `children`, never config flags** — a component with parts is a compound component
  (`Card.Header`, `Card.Body`); no boolean-prop soup. [`composition.md`](./composition.md)
- **Skeletons: one library, one bone per real element, never a grey block** — every component that can load exports
  its own skeleton, beside it. [`skeletons.md`](./skeletons.md)
- **Mobile feels native** — below `md`: bottom sheets not popovers, no visible ✕, no bottom nav, page state in the
  URL. [`mobile-native.md`](./mobile-native.md)
- **Forms in a drawer, never a modal** — right drawer from `md`, bottom sheet below, sticky footer; modals only for
  confirmations. [`forms-in-drawer.md`](./forms-in-drawer.md)
- **One appear/disappear animation** — everything that appears or disappears goes through `Collapse`; one element
  changing shape morphs; reduced motion respected. [`motion.md`](./motion.md)

The visual language itself (tokens, light/dark, density, radius/shadow, status tones, type, motion, accessibility,
overrides) is [`../DESIGN.md`](../DESIGN.md).

Web scope: the `md` breakpoints in these rules describe the **web** implementation. Native (Expo) has no `md`
contract — `Drawer` / `FormPanel` is always a bottom sheet and menus are action sheets (cross-platform native design,
§5).

## Linking them from an app

Link these files from your `AGENTS.md` instead of copying them — they ship inside the package:

```markdown
- **Forms in a drawer, never a modal** — … `node_modules/@radandevist/radan-ui/docs/rules/forms-in-drawer.md`
```

The path pattern is `node_modules/@radandevist/radan-ui/docs/rules/<file>.md`, with `<file>` one of
`visual-consistency`, `composition`, `skeletons`, `mobile-native`, `forms-in-drawer`, `motion`.
