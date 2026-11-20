---
'@radandevist/radan-ui': minor
---

Breaking: every skeleton is now owned by its component, and the root `Skeleton` object (`@radandevist/radan-ui/skeleton`) is gone. A component carries its skeleton as a static member (`Button.Skeleton`, `Input.Skeleton`, `Toast.Skeleton`, `PageBack.Skeleton`), the generic bones are components imported one by one (`BoneLine`, `BonePill`, `BoneText`, `BoneRegion`, `Bone`), so a bundler only ships what is imported. New `Card` (web and React Native) with `Card.Header` and `Card.Body`, and `Card.Skeleton`, `Card.Header.Skeleton`, `Card.Body.Skeleton`. The look, the token (`bg-foreground/10` + one pulse) and the a11y are unchanged.

| Before | After |
| --- | --- |
| `import { Skeleton } from '@radandevist/radan-ui/skeleton'` | one import per piece, see below |
| `<Skeleton>` (the region) | `<BoneRegion>` from `@radandevist/radan-ui/bone-region` |
| `<Skeleton.Card>` | `<Card.Skeleton>` from `@radandevist/radan-ui/card` |
| `<Skeleton.Card.Header>` | `<Card.Header.Skeleton>` |
| `<Skeleton.Card.Body>` | `<Card.Body.Skeleton>` |
| `<Skeleton.Line>` | `<BoneLine>` from `@radandevist/radan-ui/bone-line` |
| `<Skeleton.Pill>` | `<BonePill>` from `@radandevist/radan-ui/bone-pill` |
| `<Skeleton.Text>` | `<BoneText>` from `@radandevist/radan-ui/bone-text` |
| `<Skeleton.Bone>` | `<Bone>` from `@radandevist/radan-ui/bone` |
| `<ButtonSkeleton>` | `<Button.Skeleton>` |
| `<InputSkeleton>` | `<Input.Skeleton>` |
| `<ToastSkeleton>` | `<Toast.Skeleton>` (`Toast` from `@radandevist/radan-ui/toast`) |
| `<PageBackSkeleton>` | `<PageBack.Skeleton>` |
| `SkeletonLineSize` and the other `Skeleton*Props` types | `BoneLineSize`, `BoneLineProps`, `BonePillProps`, `BoneTextProps`, `BoneRegionProps`, `BoneProps`, `CardSkeletonProps` |

```diff
- import { Skeleton } from '@radandevist/radan-ui/skeleton';
+ import { BoneLine } from '@radandevist/radan-ui/bone-line';
+ import { BonePill } from '@radandevist/radan-ui/bone-pill';
+ import { Card } from '@radandevist/radan-ui/card';

- <Skeleton.Card>
-   <Skeleton.Card.Header><Skeleton.Line width="w-16" /><Skeleton.Pill /></Skeleton.Card.Header>
- </Skeleton.Card>
+ <Card.Skeleton>
+   <Card.Header.Skeleton><BoneLine width="w-16" /><BonePill /></Card.Header.Skeleton>
+ </Card.Skeleton>
```
