# Binding rules (HARD)

Violating one fails review; a deviation needs an explicit, user-approved justification. One line each — the file
holds the rule in full.

- **Visual consistency: one language, no one-off looks** — tokens never raw values, one shared primitive per pattern,
  flat surfaces with hairline rings, overrides are named exceptions. [`visual-consistency.md`](./visual-consistency.md)
- **Composition: parts through `children`, never config flags** — a component with parts is a compound component
  (`Card.Header`, `Card.Body`); no boolean-prop soup. [`composition.md`](./composition.md) (lint:
  [`no-boolean-prop-soup.md`](./no-boolean-prop-soup.md))
- **Skeletons: one library, one bone per real element, never a grey block** — every component that can load exports
  its own skeleton, beside it. [`skeletons.md`](./skeletons.md)
- **Mobile feels native** — below `md`: bottom sheets not popovers, no visible ✕, no bottom nav, page state in the
  URL. [`mobile-native.md`](./mobile-native.md)
- **Native navigation on the mobile web** — below `md` a page change is a screen change of the whole viewport, top bar
  included: push / back / fade / none; on back the leaving screen animates out over the previous one, already shown
  with its content; back arrow in the top bar; iPhone or Material 3 style by platform (user-overridable).
  [`native-navigation.md`](./native-navigation.md)
- **Forms in a drawer, never a modal** — right drawer from `md`, bottom sheet below, sticky footer; modals only for
  confirmations. [`forms-in-drawer.md`](./forms-in-drawer.md)
- **One appear/disappear animation** — everything that appears or disappears goes through `Collapse`; one element
  changing shape morphs; reduced motion respected; page transitions are the one exception
  ([`native-navigation.md`](./native-navigation.md)). [`motion.md`](./motion.md)

The visual language itself (tokens, light/dark, density, radius/shadow, status tones, type, motion, accessibility,
overrides) is [`../DESIGN.md`](../DESIGN.md).

Web scope: the `md` breakpoints in these rules describe the **web** implementation. Native (Expo) has no `md`
contract — `Drawer` / `FormPanel` is always a bottom sheet and menus are action sheets (cross-platform native design,
§5).

## Linking them from an app

Link **this index once** from your `AGENTS.md`, never the rules one by one: a rule added or changed in a release reaches
the app with the dependency bump, with no edit on the app's side.

```markdown
- **radan-ui binding rules (HARD)** — read `node_modules/@radandevist/radan-ui/docs/rules/README.md` and every rule it
  lists before touching UI; they apply in full to this app.
```

Every rule file is listed above with its one-line summary; a new rule is added to this list in the same pull request
that adds its file.
