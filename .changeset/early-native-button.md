---
'@radandevist/radan-ui': minor
---

Add an early `@radandevist/radan-ui/button` for web and React Native (behind the native spike): one import path, `react-native` condition for Expo/Metro, `default` for Vite. A conflicting `className` replaces the variant's utility (tailwind-merge, aware of `rounded-card`, `shadow-raised-control` and the theme colours).

Peer dependencies: adds `react` (`>=19`), `react-native` (`>=0.81`), `nativewind` (`>=5.0.0-rc.1`) and `react-native-css` (`>=3.1.0-rc.1`), **all four marked optional** in `peerDependenciesMeta`. Only the component subpaths need them (`react` for both platforms, the other three for native), so theme/CLI-only and React 18 consumers are unaffected. New runtime dependencies: `class-variance-authority`, `tailwind-merge`.
