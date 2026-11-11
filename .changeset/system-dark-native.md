---
'@radandevist/radan-ui': minor
---

React Native / Expo apps can follow the system light/dark setting. New `@radandevist/radan-ui/theme.native.css` is `theme.css` plus `@media (prefers-color-scheme: dark) { :root { … } }` (also `radan-ui theme --native`); `theme.css` is unchanged, so web apps that toggle `.dark` themselves are not turned dark by the OS. New `@radandevist/radan-ui/metro` exports `withRadanUi(config, options?)` for `metro.config.js`: it wraps `withNativewind` with `inlineVariables: false` and `inlineRem: 16`; `options` is passed through to `withNativewind` and overrides them. See the README « React Native / Expo » section.
