# Native navigation on the mobile web (HARD)

Below `md`, moving from one page to another must look and behave like a native app's screen stack: a user holding the
phone must not be able to tell it is a website. A page change that only swaps the content under a fixed header reads as
« a website » and is rejected.

Web scope: this rule describes the web implementation below `md`. From `md` up, pages change without a transition.
Native (Expo) uses the platform's own stack navigator and its defaults; nothing is imitated there.

## Screens

- **A screen is the whole viewport, top bar included.** Every screen below the top level (a detail page, the
  notifications, any full-screen view reached from the top bar) owns its top bar: back arrow, title, its actions. The
  app shell's bar is not a fixed frame the pages slide under. Product decision: the bar moves with its screen (iOS
  keeps its bar and fades only its contents; we deliberately move the whole screen).
- **Top-level screens** are the sections of the menu. They keep the shell's bar with the menu button.
- How the router nests its routes is free; what the user sees is one screen replacing another.

## History and direction

- **Opening a screen pushes one history entry**; closing it goes back one. An overlay screen (the notifications) is a
  screen like the others: one entry, same transitions, no exception.
- **The direction comes from the actual navigation**, not from the button used:

  | From → to | Transition |
  | --- | --- |
  | a history traversal to an earlier entry (top-bar arrow, phone back button, browser back) | back |
  | any screen → a screen below the top level | push |
  | top-level section → top-level section (menu) | fade |
  | reload, direct load, deep link, first paint | none |

- **The back arrow** is in the top bar, next to the title, on every screen below the top level. It goes back in
  history when the app has an earlier entry, else to the screen's parent (never out of the app: a deep link's arrow
  lands on the parent). A system edge gesture is never the only way back.

## What the user sees

- **Back: the leaving screen animates out over the previous screen, which is already there underneath with its real
  content and its scroll position** — never its skeleton, never a blank beat, and the leaving screen is never replaced
  before its exit has played. The previous screen's data comes from the cache (router / query cache) and its scroll is
  restored before the transition starts; if it is not ready within 300 ms the transition runs anyway.
- **Push: the incoming screen enters with its real top bar.** Its body may show its own skeleton while its data loads
  (as a native screen does); the bar never does.
- **Fade**: a short cross-fade of the whole viewport.

## Styles

Two styles. Initial values below; the shared module's tokens are the source of truth once it ships, tuned in the trial
(radandevist/shopkart-os#238).

- **iPhone**: push = the new screen slides in from the right (100 % → 0) and covers the old one, which moves 0 → −30 %
  and dims (a black veil 0 → 0.1 opacity); back = the exact reverse. 350 ms, `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Android (Material 3 shared axis X)**: push = the outgoing screen moves 0 → −30 px and fades out, the incoming one
  moves 30 px → 0 and fades in; back = mirrored. 300 ms; incoming `cubic-bezier(0.05, 0.7, 0.1, 1)`, outgoing
  `cubic-bezier(0.3, 0, 0.8, 0.15)`.
- **Fade** (both styles): 150 ms opacity.

## Setting and precedence

- One per-device setting, stored under the key `radan-ui:page-transition`, values `auto` (default) | `ios` |
  `material` | `none`, shown in the settings as « Automatique (selon le téléphone) », « Style iPhone », « Style Android
  (Material 3) », « Aucune ».
- `auto` = the platform's own: iOS and iPadOS → `ios` (an iPad asking for the desktop site reports a Mac user agent:
  a Mac user agent with `navigator.maxTouchPoints > 1` is iPadOS); Android → `material`; anything else → `ios`.
- **Precedence**: the OS's reduced-motion setting forces `none`; otherwise the stored setting; `auto` resolves by
  platform.

## Implementation

- The browser View Transitions API, driven by the router, with the direction passed as a view-transition type
  (`push`, `back`, `fade`) and the style as `data-page-transition` on `<html>`; CSS-only animations on the
  view-transition pseudo-elements. Page transitions are the one exception to [motion.md](./motion.md)'s « everything
  that appears or disappears goes through `Collapse` ».
- **Supported**: Chrome / Android 111+ and Safari / iOS 18+. Elsewhere the screen changes with no animation: an
  accepted degradation, never a broken or half animation.
- **A browser's own back animation wins**: when the browser already animated a back (Safari's edge swipe, reported as
  `hasUAVisualTransition`), the app adds no second transition.
- One shared module owns the setting, the platform detection, the direction and the CSS; apps wire their router to it
  and never hand-roll a page slide. Each transition kind has an acceptance test (push, back by arrow, back by history,
  fade, none on reload, none from `md`, none with reduced motion, none without the API).

Related: [mobile-native.md](./mobile-native.md), [motion.md](./motion.md), [skeletons.md](./skeletons.md).
