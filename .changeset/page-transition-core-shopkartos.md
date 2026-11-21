---
'@radandevist/radan-ui': minor
---

Breaking: the page-transition core (`@radandevist/radan-ui/page-transition`) takes ShopKartOS's behaviour verbatim, and gains the motion attribute. Nobody imported the 0.7 module; for a new adopter, the changes are:

- **Marks**: `markAppTraversal`, `markBackToParent` and the browser listeners are ShopKartOS's. `popstate` is always listened to (and `navigate` too where the Navigation API exists, to unset a non-traversal and to learn the browser animated), a mark waits for the next transition with no expiry, and `goBack` is synchronous (it returns nothing for a back, and the parent navigation's promise as it is, with no rollback). `clearMarks` and `clearBackToParent` stay exported as no-ops; the hardened marks come back in a later release.
- **`directionOf`**: the same-path-and-same-screen check comes before the arrow's `toParent`, so the arrow onto an identical place is `undefined`, no longer `'back'`. `Place` has an optional `screen`, and a different `screen` on the same path is a screen change (index to section a push, section to index a back, section to section a push, replaced in place none). `isTopLevel` is `({ path, screen }) => boolean` (was `(path) => boolean`), and `defaultIsTopLevel` is that shape: at most one path segment and no screen.
- **`transitionFor('fade', …)`** is `undefined` on iPhone: switching between top-level pages is instant on iOS, and a Material fade-through (outgoing 90 ms, incoming 210 ms with a 0.92 → 1 scale) elsewhere. `page-transition.css` is ShopKartOS's file, with its durations and curves as `--radan-ui-page-*` tokens on `:root` (defaults unchanged).
- **`guardViewTransitions`**: when `startViewTransition` throws, the fallback object has the two settled fields `{ updateCallbackDone, finished }` only. `viewTransitionRunning()` is exported.
- **`installPageTransitions`** also applies the stored motion and follows `storage` events and the reduced-motion setting; `writeStyle` also writes the motion attribute.
- **New**: `<html data-motion>` (`ios | material | none`, `auto` resolved by the platform, reduced motion resolved to `none`) through `applyMotion`, `applyStoredMotion`, `MOTION_SCRIPT` (derived from a function, proven equal to `appliedStyle` on the built package) and `<MotionScript nonce />` (inline script with `suppressHydrationWarning` plus the re-apply after a document swap).

Migration: `goBack({ canGoBack, back, toParent })` keeps its call shape but no longer returns a promise for a back; drop an `await` you relied on to clear a mark. A custom `isTopLevel(path)` becomes `isTopLevel({ path })`.
