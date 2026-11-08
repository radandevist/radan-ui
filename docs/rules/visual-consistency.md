# Visual consistency: one language, no one-off looks (HARD)

The same pattern looks and behaves the same everywhere; every visible value comes from a token, every pattern from one
shared primitive — a screen that needs a different look takes a **named, documented token override**, never its own
colours, radii or copy of a component.

- **Tokens, never raw values.** No hex/`rgb()`/`color-mix()`/ad-hoc `!important` in a component or page: colours,
  radii, shadows and status tones are `--radan-ui-*` tokens or the Tailwind utilities mapped to them
  (`bg-card`, `rounded-control`, `shadow-raised-control`). See [DESIGN.md](../DESIGN.md).
- **One shared primitive per pattern.** Card, button, pill, tabs, drawer, state view, skeleton: use the library's;
  never re-implement one locally or restyle one beyond its variants. A missing variant belongs in the library.
- **Flat surfaces, crisp hairlines.** Cards and sections are outlined by the 1px ring shadow
  (`shadow-raised-control`), not a drop shadow; a real `border` **or** the ring, never both.
- **Radius scales with control height**; `rounded-full` only for genuinely circular things (avatars, dots, spinners).
- **One height and one radius per action cluster.** Header buttons, toolbar buttons and menu rows come from the same
  component and size variant — no ad-hoc heights, sizes or inline colours.
- **Colour has one job.** Primary/accent for the selected or primary affordance, destructive for destruction,
  status tones for status. Hover is muted (`bg-muted`), not accent-coloured; meaning is never colour-only (a status
  carries a label).
- **Destructive actions live in a dedicated section** of a detail view, never in its header; list row actions and
  bulk menus are exempt.
- **Empty, error and loading states come from the shared primitives**, at one visual scale: flat (no card, ring,
  shadow or icon disc), the cause in plain words, and the next action offered. Never a bare "something went
  wrong", never fabricated data — a field the contract doesn't provide is omitted.
- **Layout constants are shared too**: z-index tiers, container widths, spacing rhythm — route through the tokens/
  utilities, never a local `z-50` or a third container width.
- **An override is a named exception** (comment + one line in the project's docs), scoped to a project, a component
  or a single surface — never a per-page variant class, never a fork.
