---
'@radandevist/radan-ui': minor
---

The web `Button` now takes native button props (`type="submit"`, `aria-*`, `ref`, `onClick`, `form`, ...) and Base UI's `render` (`<Button render={<a href="/x" />} nativeButton={false}>`) so it can replace an app's own button, link or menu trigger. `onPress` still works and the native `Button` is unchanged. New type `ButtonWebProps`.
