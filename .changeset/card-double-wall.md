---
'@radandevist/radan-ui': minor
---

Breaking: `Card` takes the ShopKartOS "double wall" shape, web and native. The frame is `bg-card` with a 4 px inset, the 14 px radius and the hairline ring; `Card.Header` is a 28 px row (`px-3 pt-1 pb-2`) holding `Card.Header.Heading` (a `Card.Header.Icon` and a `Card.Header.Label` in 12 px medium capitals) and any action after it; `Card.Body` is the inner panel (`bg-background`, 1 px `border`, `p-4`, 12 px radius), no longer a flex column with a gap. New token `--radan-ui-card-body-radius` and the `rounded-card-body` utility. `Card.Header.Label` takes `render={<h2 />}` on web (a real heading, same look) and `accessibilityRole="header"` on native. The frame no longer clips (`overflow-hidden` dropped). New parts `Card.Header.Heading`, `Card.Header.Icon`, `Card.Header.Label`, each with its `.Skeleton`; `Card.Skeleton` has the exact silhouette of the real card (no gap between header and body).
