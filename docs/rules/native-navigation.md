# Native navigation on the mobile web (HARD)

Below `md`, moving from one page to another must look and behave like a native app's screen stack: a user holding the
phone must not be able to tell it is a website. A page change that only swaps the content under a fixed header reads as
« a website » and is rejected.

Web scope: this rule describes the web implementation below `md`, in a client-side (single-page) router. From `md`
up, pages change without a transition.
Native (Expo) uses the platform's own stack navigator and its defaults; nothing is imitated there.

## Screens

- **A screen is the whole viewport, top bar included.** Every screen below the top level (a detail page, the
  notifications, any full-screen view reached from the top bar) owns its top bar: back arrow, title, its actions. The
  app shell's bar is not a fixed frame the pages slide under. Product decision: the bar moves with its screen (iOS
  keeps its bar and fades only its contents; we deliberately move the whole screen).
- **Top-level screens** are the sections of the menu. They keep the shell's bar with the menu button; in a fade
  between two of them the whole viewport, that bar included, cross-fades.
- How the router nests its routes is free; what the user sees is one screen replacing another.

## History and direction

- **Opening a screen pushes one history entry**; closing it goes back one. An overlay screen (the notifications) is a
  screen like the others: one entry, same transitions, no exception.
- **The direction comes from the actual navigation**, not from the button used. The first matching row wins:

  | Navigation | Transition |
  | --- | --- |
  | reload, direct load, deep link, first paint | none |
  | top-level section → top-level section (menu, or Back between two sections) | fade |
  | a history traversal to an earlier entry (top-bar arrow, phone back button, browser back) | back |
  | the arrow of a screen with no earlier entry, to its parent | back |
  | a history traversal to a later entry (forward) | push |
  | any other navigation to a screen below the top level | push |
  | anything else | fade |

- **The back arrow** is in the top bar, next to the title, on every screen below the top level. It goes back in
  history only when the app itself has an earlier entry (an app-owned index kept in `history.state`, never
  `history.length`, which counts other sites), else it navigates to the screen's parent: it never leaves the app. A
  system edge gesture is never the only way back.

## What the user sees

- **Back: the leaving screen animates out over the previous screen, which is already there underneath with its real
  content and its scroll position** — never its skeleton, never a blank beat, and the leaving screen is never replaced
  before its exit has played. The previous screen renders from the cache (router / query cache) it was left with, so
  it is paintable at once; its scroll is restored inside the transition's update, after the leaving screen's snapshot
  is taken. On back the leaving screen is drawn above the one revealed (the default view-transition order is the
  opposite and must be swapped).
- **Push: the incoming screen enters with its real top bar.** The bar's title comes from the route or from cached data,
  never a skeleton; the body may show its own skeleton while its data loads, as a native screen does.
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
  `material` | `none`. Each app labels it in its own i18n catalog (English: « Automatic (by phone) », « iPhone style »,
  « Android style (Material 3) », « None »).
- `auto` = the platform's own: iOS and iPadOS → `ios` (an iPad asking for the desktop site reports a Mac user agent:
  a Mac user agent with `navigator.maxTouchPoints > 1` is iPadOS); Android → `material`; anything else → `ios`.
- **Precedence**: the OS's reduced-motion setting forces `none`; otherwise the stored setting; `auto` resolves by
  platform.

## Implementation

- The browser View Transitions API (same-document), driven by the router. The style is `data-page-transition` and
  the direction `data-page-direction` (`push`, `back`, `fade`) on `<html>`, set before the transition starts, so it
  works without view-transition types; CSS-only animations on the view-transition pseudo-elements. Page transitions are the one exception to [motion.md](./motion.md)'s « everything
  that appears or disappears goes through `Collapse` ».
- **Supported**: Chrome / Android 111+ and Safari / iOS 18+. Elsewhere the screen changes with no animation: an
  accepted degradation, never a broken or half animation.
- **A browser's own back animation wins**: when the browser reports it already animated a back
  (`hasUAVisualTransition` on the navigation or popstate event), the app adds no second transition. Where the browser
  cannot report it (Safari's edge swipe without that flag), a double animation on that gesture is a known, accepted
  limit.
- One shared module owns the setting, the platform detection, the direction and the CSS; apps wire their router to it
  and never hand-roll a page slide. The module ships with an acceptance test per case: push, back by arrow, back by
  history, back to parent, fade, none on reload, none from `md`, none with reduced motion, none without the API, the
  style override, an overlay screen, and back revealing real content. Until it ships, this rule is enforced by review.

Related: [mobile-native.md](./mobile-native.md), [motion.md](./motion.md), [skeletons.md](./skeletons.md).
