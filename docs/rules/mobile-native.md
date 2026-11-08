# Mobile feels native (HARD)

Below `md`, the UI must feel like a native app, not a website shrunk down — anything that reads as « a website » on a
phone is rejected.

Web scope: these `md` rules describe the web implementation. On native there is no `md` breakpoint — sheets and action
sheets are always used (cross-platform native design, §5).

- **Bottom sheets, not popovers**: no popover or anchored dropdown menu below `md`; every menu or list of choices
  opens as a bottom sheet (popovers and dropdowns from `md` up).
- **No visible ✕** on sheets or the navigation menu: they close by swipe, backdrop or Escape.
- **No bottom navigation bar**: ☰ opens a left drawer; the avatar on the right groups account, language, theme and
  sign-out.
- **Page state lives in the URL** (tab, filters, open item, drawer flags…) and survives navigation links — reload and
  Back restore the same view.
- **Animations are progressive and scrubbed** with the gesture: no jump, no waiting for the end of a swipe.
- **Targets clear 44px** for controls and rows; fields in a sheet are 44px tall with stacked actions.
- Tablet and desktop (from `md`) keep dropdown menus, side panels and drawers.

Related: [forms-in-drawer.md](./forms-in-drawer.md), [motion.md](./motion.md).
