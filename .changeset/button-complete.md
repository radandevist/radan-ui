---
'@radandevist/radan-ui': minor
---

`@radandevist/radan-ui/button` is complete on web and React Native: variants `default`, `outline`, `secondary`, `ghost`, `destructive` and `link`; sizes `default`, `xs`, `sm`, `lg` and `icon`; a `loading` state (spinner, `aria-busy`, no press); `labelClassName` to style the label (on native `className` only reaches the pressable); `accessibilityLabel` for icon buttons; and a `ButtonSkeleton` exported beside it. Every component subpath (`@radandevist/radan-ui/<name>`) now resolves through one `./*` export pattern, to `dist/native` under the `react-native` condition and `dist/web` otherwise.

Peer dependencies: adds `@base-ui/react` (`>=1.8.0`, web components) and `@rn-primitives/{slot,portal,dialog,select,tabs,checkbox,switch,label,collapsible}` (`>=1.5.0`, native components), **all optional**: a web app installs no React Native package and an Expo app installs no Base UI.

The `link` variant label is `text-foreground` (underlined on hover on web): the primary yellow fails contrast on the light background. The component subpaths bring `class-variance-authority` and `tailwind-merge` as runtime dependencies, so theme- or CLI-only installs download them too (the `.` JS bundle does not import them).
