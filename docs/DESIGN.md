# DESIGN.md — the visual language

The single source for the look and feel of every project built on this library: principles, tokens, light/dark,
density, radius and shadow, status tones, typography, motion, accessibility, and how to override a token without
breaking consistency. Written so a designer or an agent can produce a new screen that looks like the rest **without
reading the code**.

Everything visible is a token: a colour, a radius, a shadow and a status tone are always a `--radan-ui-*` variable or
the Tailwind utility mapped to it — never a raw `hex` / `rgb()` / ad-hoc value in a component.

---

## 1. Principles

1. **One base everywhere.** The same yellow, ink, paper and greys in every project. Divergence happens through
   overrides, never by re-declaring colours locally.
2. **Tokens, never raw values.** Three layers (palette → semantic → component). A component reads a token or a
   Tailwind utility; it never spells a colour or the prefix itself.
3. **Consistency is non-negotiable.** One shared primitive per pattern (one card, one skeleton library, one state
   view, one drawer). An app adds to the library instead of forking a component.
4. **Flat surfaces, crisp hairlines.** Cards and sections are outlined by a 1px shadow ring, not a drop shadow, and an
   element never carries both a real `border` and the ring (it would double the line).
5. **Presentational components.** No strings to translate, no router, no fetching inside the library: visible text
   arrives through props/children, so every project keeps its own copy.
6. **An override is a named, documented exception** (see [§10](#10-overriding-a-token)) — never a per-page variant,
   never a copy of a component with a tweaked class.

## 2. Tokens: three layers

Every variable the library defines is prefixed; the default prefix is `radan-ui`, chosen when the theme is generated
(`radan-ui theme --prefix <p>` writes a theme with another one, e.g. `--acme-primary`). The prefix must match
`^[a-z][a-z0-9-]*$`.

Components never spell the prefix: they use Tailwind utilities (`bg-card`, `rounded-card`, `shadow-raised-control`)
whose `@theme inline` entries point at the prefixed variables — a new prefix needs no component change.

### Layer 1 — palette (the raw base)

| Token | Value |
| --- | --- |
| `--radan-ui-yellow` | `#fecd00` |
| `--radan-ui-yellow-ink` | `#423600` |
| `--radan-ui-cyan` | `#01d4f3` |
| `--radan-ui-ink` | `#18181b` |
| `--radan-ui-paper` | `#feffff` |

The palette is theme-invariant: it does not change in dark mode. Semantic tokens point at it; nothing else references
it directly except an override.

### Layer 2 — semantic (what a colour is *for*)

Light values on `:root`, dark values on `.dark`. A value is either a CSS value or a reference to another layer.

**Surfaces and text**

| Token | Light | Dark |
| --- | --- | --- |
| `background` | `#f7f7f7` | `var(--radan-ui-ink)` |
| `foreground` | `var(--radan-ui-ink)` | `var(--radan-ui-paper)` |
| `foreground-secondary` | `#3f3f46` | `#d4d4d8` |
| `card` / `card-foreground` | `#f2f2f2` / `ink` | `#1f1f23` / `paper` |
| `popover` / `popover-foreground` | `#f2f2f2` / `ink` | `#1f1f23` / `paper` |
| `popover-surface` | `#fff` | `#1f1f23` |
| `secondary` / `secondary-foreground` | `#f2f2f2` / `#3f3f46` | `#222226` / `#d4d4d8` |
| `muted` / `muted-foreground` | `#f7f7f7` / `#71717a` | `#1f1f23` / `#7f7f7f` |
| `sidebar` / `sidebar-foreground` | `#f6f6f6` / `#71717a` | `ink` / `#7f7f7f` |
| `sidebar-accent` / `-foreground` | `#fff` / `ink` | `#27272a` / `#fff` |
| `sidebar-ring` | `oklch(0.705 0.015 286.067)` | `oklch(0.552 0.016 285.938)` |

**Brand and interaction**

| Token | Light | Dark |
| --- | --- | --- |
| `primary` | `var(--radan-ui-yellow)` | *(inherited — yellow stays)* |
| `primary-foreground` | `var(--radan-ui-yellow-ink)` | *(inherited)* |
| `accent` | `var(--radan-ui-cyan)` | *(inherited)* |
| `accent-foreground` | `ink` | `paper` |
| `ring` | `var(--radan-ui-ink)` | `#d4d4d8` |
| `border` | `#e3e3e3` | `#323234` |
| `input` (text) | `#414141` | `#646a7a` |
| `input-border` | `#e4e4e7` | `#27272a` |
| `destructive` / `destructive-surface` | `#b91c1c` / `#fef2f2` | `#fca5a5` / `#450909` |

**Effects**

| Token | Light | Dark |
| --- | --- | --- |
| `radius` | `0.625rem` | *(inherited)* |
| `effect-raised-control` | `0 0 0 1px var(--radan-ui-border)` | *(inherited)* |
| `effect-primary-raised` | `0 0 0 1px rgb(120 96 0 / 30%)` | *(inherited)* |
| `effect-popover` | `0 0 0 1px rgb(0 0 0 / 6%), 0 4px 8px -2px rgb(0 0 0 / 6%), 0 12px 24px -6px rgb(0 0 0 / 12%)` | `0 0 0 1px rgb(255 255 255 / 8%), 0 12px 24px -6px rgb(0 0 0 / 60%)` |

Status tones are semantic tokens too — see [§6](#6-status-tones).

### Layer 3 — component (one knob per component)

Pointing at the semantic layer: override one and every instance of that component follows.

| Token | Value |
| --- | --- |
| `--radan-ui-card-bg` | `var(--radan-ui-card)` |
| `--radan-ui-card-foreground` | `var(--radan-ui-card-foreground)` |
| `--radan-ui-card-radius` | `14px` |
| `--radan-ui-card-shadow` | `var(--radan-ui-effect-raised-control)` |
| `--radan-ui-control-radius` | `calc(var(--radan-ui-radius) * 1.4)` |
| `--radan-ui-popover-radius` | `14px` |
| `--radan-ui-toast-radius` | `12px` |

### The Tailwind bridge (`@theme inline`)

Components and screens use Tailwind names; the `@theme inline` block maps each to its prefixed variable.

| Tailwind name | Reads |
| --- | --- |
| `bg-background`, `text-foreground`, `bg-card`, `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, … | the semantic colour of the same name |
| `rounded-sm` … `rounded-4xl` | `radius × 0.6 / 0.8 / 1 / 1.4 / 1.8 / 2.2 / 2.6` |
| `rounded-card`, `rounded-control`, `rounded-popover`, `rounded-toast` | the component radius tokens |
| `shadow-raised-control`, `shadow-primary-raised`, `shadow-popover` | the `effect-*` tokens |

## 3. Light and dark

- Light is the design canvas (`:root`, `color-scheme: light`); dark lives under the `.dark` class on the root element
  (`color-scheme: dark`). A project toggles it by adding/removing the class — the swap is instant, no flash.
- Every semantic token that changes is declared **in both blocks**; the palette and theme-invariant values are not
  duplicated.
- Dark is authored, not computed: each dark value is picked against its light counterpart (surfaces lift, text stays
  readable, borders darken rather than vanish).
- Never branch on the theme inside a component (`dark:` utilities are fine — they route through the same tokens).

## 4. Density

- **Dense by default.** This is an operations UI, not a landing page: compact controls, tight lists, tables that show
  more rows than whitespace.
- Spacing is the Tailwind spacing scale (4px base): `gap-2`, `p-3`, `space-y-1`. No one-off pixel margins.
- **Radius scales with control height** — a small control must not look pill-ish. The base radius is
  `--radan-ui-radius` (`0.625rem`); controls sit at `--radan-ui-control-radius`, cards at `--radan-ui-card-radius`.
- One button height and one radius inside a header action cluster; use the component's size variants, never ad-hoc
  heights.
- `rounded-full` / `999px` is only for genuinely circular things (avatars, dots, spinners). Everything else goes
  through the radius scale.

## 5. Radius and shadow scale

**Radius** — from `--radan-ui-radius` (`0.625rem`), via the bridge:

| Utility | Computed | Use |
| --- | --- | --- |
| `rounded-sm` | `0.375rem` | small chips, tags |
| `rounded-md` | `0.5rem` | compact controls |
| `rounded-lg` | `0.625rem` | default (inputs, tabs) |
| `rounded-xl` / `2xl` / `3xl` / `4xl` | `×1.4 / ×1.8 / ×2.2 / ×2.6` | menus, sheets, big panels |
| `rounded-card` | `14px` | cards |
| `rounded-control` | `calc(radius × 1.4)` | buttons, inputs |
| `rounded-popover` | `14px` | popovers, menus |
| `rounded-toast` | `12px` | toasts |

**Shadow** — flat surfaces, elevation only where something floats:

| Token / utility | Shape | Use |
| --- | --- | --- |
| `shadow-raised-control` (`effect-raised-control`) | `0 0 0 1px var(--radan-ui-border)` | card/section hairline ring — no layout width |
| `shadow-primary-raised` (`effect-primary-raised`) | `0 0 0 1px rgb(120 96 0 / 30%)` | the selected/primary-raised state |
| `shadow-popover` (`effect-popover`) | hairline + two soft drops | popovers, menus, dialogs |

Rules: a ring **or** a real `border`, never both; no `shadow-md`/`shadow-lg` ad-hoc elevation on flat surfaces;
popups are re-based in dark by the token, never by a component.

## 6. Status tones

Each status is a `background` / `foreground` / `border` triplet — a pill is
`bg-status-<x>-background text-status-<x>-foreground border-status-<x>-border`, never a hand-tinted colour.

| Status | Light bg / fg / border | Meaning |
| --- | --- | --- |
| `status-success` | `#15803d` (text/icon, light) · `#86efac` (dark) | generic success |
| `status-warning` | `#b45309` · `#fdd34d` (dark) | generic warning |
| `status-open-*` | `#dff2fe` / `#00598a` / `#b8e6fe` | open / in progress |
| `status-pending-*` | `#fef3c7` / `#92400e` / `#fde68a` | waiting / pending |
| `status-resolved-*` | `#dcfce7` / `#166534` / `#bbf7d0` | done / resolved |
| `status-closed-*` | `#f4f4f5` / `#52525b` / `#e4e4e7` | neutral / closed |
| `status-breached-*` | `#fff1f2` / `#be123c` / `#fecdd3` | breach / overdue / SLA |
| `destructive` (+ `destructive-surface`) | `#b91c1c` / `#fef2f2` | destructive actions and errors |

Dark values ship in the same three-token shape (e.g. `status-open-*` → `#082f49` / `#7dd3fc` / `#075985`). Map a
domain status to one tone in **one place** (a `status → tone` map); a pill never invents its own colour.

## 7. Typography

- The library ships **no font tokens**: a project picks its family and registers it once. Use Tailwind's type
  utilities; no bespoke type scale beyond them.
- Dense by default: body/UI text small and legible (`text-sm` / `text-[13px]` style), badges and eyebrows smaller,
  page titles `text-xl`/`text-2xl font-semibold`.
- Weight ladder is three steps: 400 regular, 500 medium, 600 semibold. No 700+ on UI chrome.
- **Copy case**: sentence case for status, field and message strings; Title Case for navigation and noun labels;
  imperative verbs for actions (`Save`, `Delete`, `Add`); an ellipsis for in-flight states (`Loading...`).
- Truncate list-row text to one line with a `title` tooltip under a `min-w-0` parent; full-width prose may wrap.

## 8. Motion

- **One appear/disappear path**: everything that appears or disappears goes through the library's `Collapse`
  (a `0fr ↔ 1fr` grid-track step), never a hand-rolled `width`/`height`/`opacity` transition.
- **One morph path**: a single element changing shape and state morphs (shared parts stay mounted and glide); it is
  never cross-faded into a copy of itself.
- **Two curves, defined once**: `ease-enter` and `ease-exit`. No bespoke `cubic-bezier` in a component.
- **A small duration scale**: colour/feedback ≈ `120ms`, layout/surfaces ≈ `240ms`. A surface unmounts after its exit.
- Entrances (`rise`, `pop`, `fade`) play **once on mount**, cascaded with a `--i` index (~45ms apart); never re-play on
  re-render.
- `prefers-reduced-motion`: entrances become plain fades, morphs stop moving entirely — enforced inside the
  primitives, not by each caller.

## 9. Accessibility

- **Contrast floors**: body text **4.5:1** against its surface; large text, focus indicators and UI graphics
  **3:1**. Secondary text uses `muted-foreground`, real content uses `foreground-secondary` — never a "subtle" tint
  for standalone body-size text.
- **Focus**: every interactive element shows a `focus-visible` ring built from `ring` (≥3:1 against its surface);
  the ring is part of the component, callers never remove it. `aria-invalid` adds a tint without replacing it.
- **Loading**: a loading region is `aria-busy` with a visually hidden status line; every skeleton bone is
  `aria-hidden` (the primitive does it — never pass text or roles to a bone).
- **Touch**: below `md`, controls and rows clear a 44px target; sheets close by swipe, backdrop or Escape.
- Keyboard: menus, drawers and dialogs are operable and focus-trapped per their primitive; Escape closes, focus
  returns to the trigger.
- Never encode meaning in colour alone: a status pill carries a label (and, where it exists, an icon).

## 10. Overriding a token

Three levels, in order of preference. An override is a **named, documented exception**: comment it where you write it
and record it in the project's docs (one line: what, why, when to remove it). Never a per-page variant class, never a
forked component.

**Per project** — regenerate with your own prefix, or re-declare after the import (later declaration wins):

```css
@import '@radandevist/radan-ui/theme.css';

:root {
	/* exception: brand-primary-2026 — project accent, revisit when the brand refreshes */
	--radan-ui-primary: #f59e0b;
}
```

**Per component** — override the component layer so every instance follows:

```css
:root {
	/* exception: flat-cards — this project's cards are square-ish */
	--radan-ui-card-radius: 4px;
	--radan-ui-card-shadow: 0 0 0 1px var(--radan-ui-border);
}
```

**Per surface** — one card, one button, one drawer: a scoped style, still a token, still named:

```tsx
<div className="rounded-card" style={{ ['--radan-ui-card-radius']: '2px' } as React.CSSProperties}>
```

Dark mode: an override that must differ in dark is re-declared under `.dark`. An override never touches another
token's value (no overriding `card-radius` by changing `radius`), and it never hardcodes what a token exists to
express.
