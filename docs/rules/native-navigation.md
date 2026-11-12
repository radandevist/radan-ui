# Native navigation on the mobile web (HARD)

Below `md`, moving from one page to another must look and behave exactly like a native app's screen stack. A user
holding the phone must not be able to tell it is a website. A page change that only swaps the content under a fixed
header reads as « a website » and is rejected.

Web scope: this rule describes the web implementation below `md`. From `md` up, pages change without a transition.
Native (Expo) uses the platform's own stack navigator and its defaults; nothing is imitated there.

## The screen, not the content

- **The whole viewport transitions**, top bar included. A pushed screen (a detail page, the notifications) owns its
  top bar: back arrow, title, its actions. The app shell's bar is not a fixed frame the pages slide under.
- How the router nests its routes is free; what the user sees is one screen replacing another.

## Directions

| Navigation | Transition |
| --- | --- |
| Open a detail, open the notifications (push) | the new screen enters, see styles below |
| Back: the top-bar arrow **or** the phone's back button / browser back | the reverse of the push |
| Switch section from the menu (sibling top-level pages) | a short cross-fade |
| Reload, direct load, deep link, first paint | none |
| Reduced motion | none |

- **Exit before the page behind**: on back, the leaving screen animates out over the previous screen, which is
  already rendered with its real content and its scroll restored — never its skeleton, never a blank beat.
- **The back arrow is always in the top bar, next to the title.** Do not rely on a system edge gesture for going
  back; the arrow and the phone's back button are the contract.
- Overlay screens (notifications, any full-screen sheet reached from the top bar) follow the same transitions and the
  same setting — no per-screen exception.

## Styles

Two styles, chosen per device:

- **iPhone**: push = the new screen slides in from the right and covers the old one, which shifts about 30 % left and
  dims slightly; back = the reverse. About 350 ms, iOS curve.
- **Android (Material 3 shared axis X)**: push = the outgoing screen slides about 30 px left and fades out while the
  incoming one slides in from about 30 px right and fades in; back = mirrored. About 300 ms, M3 emphasized curves.

**Default = the platform's own**: iOS and iPadOS → iPhone style; Android → Material 3. The user can override it in the
settings: « Automatique (selon le téléphone) » (default), « Style iPhone », « Style Android (Material 3) », « Aucune ».
The choice is stored per device.

## Implementation

- The browser View Transitions API, driven by the router (push / back / fade as transition types), with CSS-only
  animations on the view-transition pseudo-elements. No animation library is needed for page changes.
- Feature-detect it: without the API the navigation happens with no animation, never a broken one.
- One shared module owns the style, the direction and the CSS; apps wire their router to it, they do not hand-roll a
  page slide.

Related: [mobile-native.md](./mobile-native.md), [motion.md](./motion.md), [skeletons.md](./skeletons.md).
