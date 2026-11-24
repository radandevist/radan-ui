# Shared error pages and empty states — design (phase 2 of the shared app blocks)

Status: DRAFT for owner review, 2026-11-24. Tracks [radan-ui#92](https://github.com/radandevist/radan-ui/issues/92), the phase 2 announced by [radan-ui#80](https://github.com/radandevist/radan-ui/issues/80) and the phase-1 spec [`2026-11-21-page-transitions-design.md`](./2026-11-21-page-transitions-design.md).

Owner decision (binding, 24/11, already stated on 21/11): « Ce qu'on a dans Shopkart aujourd'hui me satisfait déjà… ce sont ces implémentations-là qu'il faut promouvoir vers radan-ui ». No redesign: the existing ShopKartOS screens are extracted as they are — same look, same texts (through props/children), same actions. Where copying as-is is wrong, this spec says so (§11) without changing it.

Docs only: no product code in this branch.

Sources read for this spec (all read-only):

- ShopKartOS `origin/main` at `1eeb6f5` (the production clone): `apps/web/src/components/{error-state,error-card,empty-state,filter-empty-state}.tsx`,
  `router.tsx`, `routes/__root.tsx`, `routes/{pickups.$code,forwarders.$id}.tsx`, `features/{items,forwarders,pickups,notifications,pending-checks,tracking,auth,admin,settings,attachments}`
  (every state call site and its skeleton), `lib/error-kind.ts`, `i18n/locales/{en,fr}.json`, `scripts/layout-check*.ts`, `tests/error-kind.test.ts`.
- radan-ui `origin/main` at `77bde0a` (`0.14.1`): `CONTRIBUTING.md`, `docs/rules/{composition,visual-consistency,skeletons,no-boolean-prop-soup}.md`,
  `packages/radan-ui/src/components/{card,button,bone,bone-region,load-guard,page-transition,page-transition-tanstack-router}`, `scripts/components.ts`,
  `tests/components.test.ts`, `apps/catalog`.
- PublyApp `develop` at `149d759c` (radan-ui `0.8.0`): `apps/front/src/components/ui/{state-view,state-surface}.tsx`, `components/error-views/*`, `lib/error-kind.ts`,
  `routes/__root.tsx`, `package.json`.
- The phase-1 spec (form, conventions, `layout-check` gate, rules).

Nothing was run on a device or against a built app. Claims about pixels come from reading the two components' class strings; the ones that need a real
comparison are marked **verify**.

---

## 1. The finding that changes the plan

**radan-ui has no state block at all.** Phase 1 deliberately left it out: its `load-guard` only throws `load_timeout`, and the phase-1 spec put
"the error screen that renders `load_timeout`, and « Réessayer »" and "empty states" explicitly out of its scope (§2 non-goals, §10). So unlike phase 1,
phase 2 is a straight extraction, not a two-way catch-up merge.

Three facts shape it:

1. **The two ShopKartOS components are already library-shaped.** `error-state.tsx` (89 lines) and `empty-state.tsx` (50 lines) are pure presentation:
   plain elements, `rounded-control`, `shadow-raised-control` and the `--radan-ui-status-*` tokens. They import no router, no fetch, no app module. The only
   non-shared dependencies are (a) the i18n string `error-screen.details` inside `ErrorState`, and (b) the caller-supplied Tabler icon. Both leave cleanly
   (label as a prop, icon as a prop).
2. **The same pictogram already exists a second time.** PublyApp's `state-view.tsx` re-implements the exact ShopKartOS pictogram (two rings + a −6° tilted tile),
   with the comment "Both are the ShopKart OS pictogram (owner decision 04/11)" — and it uses one component for empty and error, page and inline.
   That is both proof the look is cross-app and the best prior art for the API (Title ref, `role`, `aria-live`).
3. **One radan-ui HARD rule forbids the copied look.** [`visual-consistency.md`](../rules/visual-consistency.md) says empty and error states must be
   "flat (no card, ring, shadow or icon disc)". ShopKartOS's states are two rings and a raised tilted tile. Copying verbatim means **amending the rule**,
   not restyling the block (§11.1). That amendment is the one blocking owner decision in R1.

Consequence — the plan is:

- **R1 (radan-ui)** — one web-only subpath, `@radandevist/radan-ui/app-state`, holding two compound roots (`ErrorState`, `EmptyState`) that share one
  variants file and therefore one look. No i18n, no router, no fetch, no new icon dependency, no skeleton (a terminal state has no loading shape, §4.3).
  A catalog page and unit tests. Minor release `0.15.0`.
- **S1 (ShopKartOS)** — delete its two local components, compose the shared parts, keep every text, action, route and behaviour. Gates: `layout-check`
  186/186 and before/after captures of every state identical (§10.2).
- **S2 (PublyApp)** — adopt the same block behind its existing `StateSurface` wrappers (§10.3).

**No TanStack Router adapter is needed** (§8): `errorComponent` / `notFoundComponent` accept any component, and the only router-bound line —
`router.invalidate()` — belongs with the app's query reset and `reset()`, not in a peer dependency.

---

## 2. Goals, non-goals, anti-goals

### Goals

1. One shared block renders ShopKartOS's error and empty states **pixel-identically**: same geometry, same type scale, same tones, same action cluster,
   same disclosure.
2. Compound components composed through `children`; no boolean that switches a part on or off, no `variant`/`presentation`/`embedded` flag soup.
3. Zero i18n, zero router, zero fetch and zero browser-only effect in the block. Every text, icon, tone and action comes from the caller.
4. One element, one aspect, everywhere: the class strings live once in `app-state.variants.ts`; an app cannot get a different size, radius or tone by accident.
5. ShopKartOS S1 consumes it with **no visible or behavioural change**; PublyApp S2 consumes the same block behind its wrappers.
6. A catalog page (four screenshots), unit tests, a DOM-parity fixture, and two package guards (no router/i18n import; a documented no-skeleton exception).
7. The extracted look becomes the documented shared look, by amending `visual-consistency.md` (owner decision, not a silent exception).

### Non-goals (phase 2)

- `ErrorCard` / `NotFoundState` behaviour: error classification, i18n keys, route targets, retry wiring (`queryReset` + `reset()` + `router.invalidate()`),
  the online listener and auto-retry, `usePageTitle`, the signed-out redirect. They stay app-side (§4.2) and are only rewired to the block.
- The inline error surfaces and the inline empties listed in §3.3–§3.4 (drawer sections, dropdowns, in-card "no files", form validation lines).
- Skeletons: the page/list skeletons stay app-side and keep using `Bone`/`BoneRegion` (§4.3).
- A native (`react-native`) side. ShopKartOS's native app has no such screens (`apps/mobile/src/items.tsx:35-39` is an `ActivityIndicator` / plain `Text`).
- New tones. The block has ShopKartOS's four (`info | neutral | warning | danger`); PublyApp's `primary` maps in its wrapper (§11.12).
- A TanStack Router adapter, a route-aware `ErrorPage`, or any `status` → `kind` mapping in the library.
- Full-page form errors (login) and field errors: they stay app-side.

### Anti-goals (what would make this wrong)

- A single `StateView` with `presentation`, `scale`, `embedded`, `panel` and `backOnly` flags: that is PublyApp's current coat, not a compound.
- `ErrorCard` moved into the library: it would drag `classifyError`, `i18next`, `useQueryErrorResetBoundary` and the routes with it.
- A `Skeleton` for a state that never loads, or a skeleton exemption that quietly disables the guard for other components.
- Restyling the pictogram flat "to satisfy the rule": the owner has ruled; the rule changes, not the look.
- Per-page copies of the class strings, or an app passing a different ring/tile size.

---

## 3. Inventory — every occurrence, ShopKartOS as of 24/11

Counting rule used below: a **page-level** occurrence is a distinct screen the user can land on (a mount point or a `ErrorCard` branch) or a distinct
collection-level empty render site. Adjacent inline surfaces are listed separately and are **out of the block's scope**. That gives **23 error
occurrences (15 page-level + 8 inline)** and **28 empty occurrences (18 collection-level + 10 inline)**, plus six inline placeholders that are not states.

Legend: **P** = page scale (`min-h-[60dvh]`, centred), **I** = inline (no min-height), **C** = compact. **R** = retry (primary), **B** = back (outline
unless stated), **H** = home (primary, 403 only), **D** = "Technical details" disclosure. All actions are `Button` from radan-ui; all strings are
`react-i18next` keys in `i18n/locales/{en,fr}.json`.

### 3.1 Error pages and cards

**Mount points (2).**

| # | Mount | Source | What changes |
| --- | --- | --- | --- |
| E1 | Root `errorComponent` (the locale read or the root itself failed) | `routes/__root.tsx:37-43,127` | Wrapped in a fresh `RootDocument`: the document is swapped, the shell is gone; `THEME_SCRIPT` / `MotionScript` re-apply (§6.5). |
| E2 | Router `defaultErrorComponent` (any page's load failed) | `router.tsx:45` | Rendered inside the app shell, so the rail/top bar remain; the page title is published by `usePageTitle`. |

**`ErrorCard` kinds (6 screens + 1 redirect).** The component is `error-card.tsx:98-208`; the classifier is `lib/error-kind.ts:18-33`.

| # | Kind | Trigger | Pictogram / tone / role | Title | Description | Actions | D | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E3 | `signed_out` | message `unauthenticated` | — | — | — | `<Navigate to="/login" />`, no screen | — | `error-card.tsx:140-142` |
| E4 | `offline` | `!navigator.onLine` or a browser network-failure message | `IconWifiOff` / `info` / **`status`** | `error-screen.offline-title` ("No connection") | `error-screen.offline-text` | R + B | yes | `error-card.tsx:151-163`; auto-retry on `online` at `:111-120` |
| E5 | `not_found` | `isNotFound()` or a message ending `_not_found` | `IconZoomQuestion` / `neutral` / `alert` | `error.<code>` if it exists, else `page.not-found` | `error-screen.not-found-text` | R + B | no | `error-card.tsx:164-174` |
| E6 | `forbidden` | message `forbidden` (thrown by `features/auth/guard.ts`) | `IconLock` / `warning` / `alert` | `error-screen.forbidden-title` ("Access denied") | `error-screen.forbidden-text` | **H only** (`default`) | no | `error-card.tsx:175-185` |
| E7 | `server` | the message is a translated `error.<code>` (includes `load_timeout`) | `IconServerOff` / `danger` / `alert` | `error-screen.server-title` ("Something went wrong") | `error.<message>` | R + B | yes | `error-card.tsx:186-197` |
| E8 | `unknown` | anything else | `IconAlertTriangle` / `danger` / `alert` | `page.data-error` | `error-screen.unknown-text` | R + B | yes | `error-card.tsx:198-207` |

`error-screen.details` is the disclosure label and is **the only string inside `ErrorState`** (`error-state.tsx:78`). `errorDetails()` puts
`error.stack ?? error.message` in the `<pre>` (`lib/error-kind.ts:36-37`) — flagged in §11.7.

**`NotFoundState` call sites (6).** Component `error-card.tsx:72-91`: `IconZoomQuestion` / `neutral` / `alert`, description
`error-screen.not-found-text`, actions **R + B**, no details, `h1`, page title set to the heading.

| # | Mount | Title | Back to | Source |
| --- | --- | --- | --- | --- |
| E9 | Root `notFoundComponent` (no route matched) | `page.not-found` | `/` | `routes/__root.tsx:34,129` |
| E10 | `/pickups/$code` `notFoundComponent` (loader threw `notFound()`) | `pickup.not-found` (`{{id}}`) | `/pickups` | `routes/pickups.$code.tsx:24`, `pickup-page.tsx:25-29` |
| E11 | `/pickups/$code` component guard (same absence, second path) | same | `/pickups` | `pickup-page.tsx:47-49` |
| E12 | `/pickups/visit/$start` component guard | `pickups.visit-not-found` | `/pickups` | `visit-page.tsx:36-38` |
| E13 | `/forwarders/$id` `notFoundComponent` | `forwarder.not-found` | `/forwarders` | `routes/forwarders.$id.tsx:16`, `forwarder-page.tsx:21-24` |
| E14 | `/forwarders/$id` component guard | same | `/forwarders` | `forwarder-page.tsx:32-34` |

**Whole-page form error (1).**

| # | Site | What is shown | Source |
| --- | --- | --- | --- |
| E15 | `/login` sign-in refusal | `<p role="alert" className="text-sm text-destructive">{t(login.error.message)}</p>` under the password field, inside the full-page `Card`; submit button `loading`; no icon, no title | `features/auth/components/login-form.tsx:62-66` |

**Inline error surfaces (8, out of the block).**

| # | Site | What is shown | Why it stays app-side |
| --- | --- | --- | --- |
| E16 | `components/fields.tsx:68-90` | `FieldError`: `role="alert"` sr-only + animated `text-destructive` under the input, linked by `aria-describedby` | field-level, animated by `Collapse`, reused by every form |
| E17 | `features/items/components/estimation-sheet/analysis-card.tsx:67-88` | `Failure`: `role="alert"` card, `IconAlertTriangle`, `errorText(code)`, outline retry (44→36) | inline in the estimation sheet, own card frame |
| E18 | `features/items/components/drawer/item-history.tsx:56` | `<p className="text-destructive">{errorText(error)}</p>` | drawer tab |
| E19 | `.../estimation-sheet/sheet-footer.tsx:28` | `error` save status: `IconCloudOff` + destructive text | footer status, not a screen |
| E20 | `features/items/components/order-form.tsx:284` | `order-form.invalid-fields` line | form-level validation inside a sheet |
| E21 | `features/settings/components/settings-page.tsx:141` | `settings.invalid` line | form validation |
| E22 | `features/settings/components/ai-settings.tsx:150` | `error.ai_models_unavailable` line | query error in a settings card |
| E23 | `features/exchange-rates/components/rate-feed-row.tsx:59` | `settings.rate-failing` destructive line | one row |

### 3.2 Empty states

**Primitive.** `empty-state.tsx:11-50`: root `flex flex-col items-center px-4 text-center` + `py-12` / `py-8` (C), two card-tinted rings
(120 / 96 px), a 56 / 44 px tilted tile with `shadow-[var(--radan-ui-effect-raised-control)]`, `h2` 18 / 16 px, a 14 / 13.5 px paragraph
(`max-w-[380px]`), actions `mt-5 flex flex-wrap justify-center gap-2`. `compact` is the only variant, exposed as a boolean today.
`FilterEmptyState` (`filter-empty-state.tsx:8-22`) is app composition: `IconSearch`, `empty.no-match-filter(-text)`, an outline "Clear the filter"
button (44→36) — not a library primitive.

**Collection-level states (18).**

| # | Site | Pictogram | Title / text | Actions | Scale | Skeleton associated | Layout (phone → desktop) | A11y | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Tracking, "unknown parcels" all attached | `IconLink`, success tint | `tracking.all-attached` / `tracking.all-attached-text` | none | **C** | `TrackingPageSkeleton` (`routes/forwarders.tracking.tsx:24`) | inline in `Card.Body p-0` | `h2`, no role | `tracking-page.tsx:118-123` |
| A2 | Forwarders, filter hides all | `IconSearch` | `empty.no-match-filter` / `-text` | Clear filter (outline) | I | `ForwardersListSkeleton` (`routes/forwarders.index.tsx:13`) | py-12, button 44→36 | `h2` | `forwarders-list.tsx:181` |
| A3 | Forwarders, none at all | `IconTruckDelivery` | `empty.forwarders` / `-text` | New forwarder (primary) | I | same | py-12, both buttons 44→36 | `h2` | `forwarders-list.tsx:184-190` |
| A4 | Pending checks, filter hides all | `IconSearch` (via `FilterEmptyState`) | `empty.no-match-filter` / `-text` | Clear filter | I | `PendingChecksPageSkeleton` (`routes/pending-checks.tsx:13`) | py-12, 44→36 | `h2` | `pending-checks-page.tsx:34` |
| A5 | Pending checks, none at all | `IconCircleCheck` | `check.none` ("Nothing to confirm") | none | — | same | a plain success line, `text-sm text-status-success` | none | `pending-checks-page.tsx:37-42` |
| A6 | Home, no item in the org | `IconPackage` | `empty.no-items` / `-text` | New estimate (primary) | I | `HomeSkeleton` (`routes/index.tsx:48`) | py-12, 44→36 | `h2` | `home-empty.tsx:74-81` |
| A7 | Home, search/filter hides all | `IconFilterOff` | `empty.no-match` + composed `empty.nothing-for` / `-no-result` / `-with-filters` / `-in-tab` | Clear (primary) + "search every tab" (outline) | I | same | py-12, 44→36 | `h2` | `home-empty.tsx:91-111` |
| A8 | Home, empty tab | tab icon (`evaluate` sparkles, `progress` truck, `done` check, `rejected` x, `all` package) | `empty.tab-title` / `empty.tab-{tab}` | New estimate (evaluate only) + see all (outline) | I | same | py-12, 44→36 | `h2` | `home-empty.tsx:113-125` |
| A9 | Pickups, filter hides all | `IconSearch` | `pickups.no-match-title` / `-text` | Clear filters (outline) | I | `PickupsPageSkeleton` (`routes/pickups.index.tsx:13`) | py-12, 44→36 | `h2` | `pickups-feed.tsx:119-130` |
| A10 | Pickups, no past pickup | `IconReceipt` | `pickups.no-past-title` / `-text` | none | I | same | py-12 | `h2` | `pickups-feed.tsx:131` |
| A11 | Pickup / visit, no item in the table | `IconPackageOff` | `empty.pickup-items` / `-text` | none | I | `PickupPageSkeleton` / `VisitPageSkeleton` (the table's `ItemsTable.Skeleton`) | inside the table's empty cell, sticky-left wrapper | `h2` inside the `td` | `pickup-items-table.tsx:64` |
| A12 | Inbox (desktop drawer and phone sheet) | `IconBellCheck` | `notification.empty.title` / `-text`, or `notification.empty-read.title` / `-text` when unread is empty but the all list is not | none | I | `InboxList.Skeleton` (`inbox-list.tsx:89-96`) | same block; drawer vs sheet is the container | `h2` | `inbox-list.tsx:99-108` |
| A13 | Tracking, never synced | `IconRadar2` | `tracking.empty-title` / `-text` | Sync now (primary, `loading`/`aria-busy`) | I | `TrackingPageSkeleton` | py-12, 44→36 | `h2` | `tracking-page.tsx:213-219` |
| A14 | `ItemsTable` fallback, when a caller passes no `empty` | none | `table.no-match` | none | — | parent page | `py-10 text-center text-sm text-muted-foreground` | none | `items-table.tsx:94` (no current caller relies on it: Home and the pickup table pass `empty`) |
| A15 | `/admin`, no client space | none | `admin.spaces-empty` | none | — | `AdminPageSkeleton` (`routes/admin.tsx:18`) | plain line in a `Card.Body` | none | `spaces-section.tsx:161-163` |
| A16 | `/admin`, no other shop account | none | `admin.shop-owners-empty` | none | — | same | plain line | none | `spaces-section.tsx:198-200` |
| A17 | `/admin`, no global forwarder | none | `admin.global-forwarders-empty` | none | — | same | plain line | none | `global-forwarders-section.tsx:26-28` |
| A18 | `/settings` history, no change | none | `history.empty` | none | — | `ChangesList.Skeleton` while pending | plain line in a `SettingRow` | none | `history-rows.tsx:20-26` |

**Inline empty surfaces (10, out of the block).**

| # | Site | What is shown |
| --- | --- | --- |
| A19 | `features/attachments/components/gallery.tsx:50` | `gallery.empty` line under a loaded, empty gallery |
| A20 | `features/pickups/components/pickup-expenses.tsx:64` | `expense.empty` line above the add button |
| A21 | `features/pickups/components/pickup-items-field.tsx:23` | `pickups.form-items-none` line in a fieldset |
| A22 | `features/tracking/components/order-combobox.tsx:167` | `tracking.no-order` in the dropdown |
| A23 | `features/tracking/components/unknown-parcel.tsx:43` | `tracking.no-candidate` in a row |
| A24 | `.../estimation-sheet/competitor-block.tsx:99` | `competitor.empty` note |
| A25 | `.../drawer/competitor-list.tsx:114` | `competitor.empty` line |
| A26 | `.../drawer/item-files.tsx:195` | `drawer.files-empty` (read-only) |
| A27 | `.../drawer/item-files.tsx:198` | `drawer.files-add` dashed dropzone (editable) |
| A28 | `.../estimation-sheet/captures.tsx:110` | `estimation.captures-title` + choose-images dropzone |

**Not states (6).** `InlineEdit` placeholders: `drawer/tracking-number.tsx:44`, `drawer/item-drawer-body.tsx:130,146`,
`drawer/purchase-rows.tsx:98,111`, `drawer/estimation-section.tsx:214`. They are field placeholders, not empty regions.

### 3.3 The numbers

| | Page/collection level | Inline | Total |
| --- | --- | --- | --- |
| Errors | **15** (2 mounts + 6 `ErrorCard` kinds + 6 `NotFoundState` + 1 login) | 8 | 23 |
| Empty states | **18** (10 `EmptyState` + 2 `FilterEmptyState` render sites + 6 ad-hoc lines) | 10 | 28 |

The block is composed by all **6 `ErrorCard` screens** and the **6 `NotFoundState` call sites**, and it replaces the **12
`EmptyState`/`FilterEmptyState` render sites** (the 6 ad-hoc empty lines, A5 and A14–A18, stay plain in S1; §11.6). The login error (E15) and the 18
inline surfaces stay app-side.

---

## 4. What is common, what stays in the app

### 4.1 Common — moves into `@radandevist/radan-ui/app-state`

| Element | Today | Becomes |
| --- | --- | --- |
| Error pictogram: 144 px box, two tinted rings (30 % / 60 %), 64 px tile, −6° / +6°, `stroke 1.75` | `error-state.tsx:29-42` | `ErrorState.Pictogram` |
| Error tones: `info`, `neutral`, `warning`, `danger` → six class pairs from `--radan-ui-status-*` | `error-state.tsx:9-26` | `app-state.variants.ts` (one map) |
| Error layout: 60dvh centring, `max-w-sm`, `h1` 20 px, 14 px text, action cluster, disclosure | `error-state.tsx:66-89` | `ErrorState` + `.Title` / `.Description` / `.Actions` / `.Details` |
| Empty pictogram: 120 / 96 px, two card rings, 56 / 44 px tile, same tilt | `empty-state.tsx:26-38` | `EmptyState.Pictogram` |
| Empty type scale and spacing: 18 / 16 px title, 14 / 13.5 px text, `max-w-[380px]` | `empty-state.tsx:39-49` | `EmptyState` + `.Title` / `.Text` / `.Actions` |
| Empty sizes: default / compact | `compact` boolean | `size="default" \| "compact"` on the root, read by the parts through context |
| Disclosure geometry and chevron | `error-state.tsx:75-85` | `ErrorState.Details` (inline MIT Tabler `chevron-down` path, no icon dependency) |

### 4.2 App-specific — stays in the app

| Thing | Why it cannot move |
| --- | --- |
| Which icon and tone per condition | `ErrorCard`'s six-way `classifyError` is ShopKartOS's message contract (`unauthenticated`, `forbidden`, `*_not_found`, `error.<code>`); PublyApp's is its own |
| Every string | i18n keys and both locale files; the block takes props/children, including the disclosure label |
| Routes and back targets (`BackTo = '/' \| '/pickups' \| '/forwarders'`) | router-specific |
| Retry effect (`queryReset.reset()` + `reset?.()` + `router.invalidate()`) | TanStack Query + TanStack Router + the error boundary, in that order |
| `useOnline`, the `online` listener and the offline auto-retry | browser state and a side effect; the block is pure |
| `usePageTitle(heading)` | the page title belongs to the shell, per phase 1 |
| Signed-out redirect to `/login` | routing policy |
| `RootDocument` wrapping E1 | the document swap, theme and motion scripts |
| The page/list skeletons (`HomeSkeleton`, `InboxList.Skeleton`, …) | they mirror app layouts, composed from `Bone`/`BoneRegion` |
| `FilterEmptyState`, `HomeEmpty` | app compositions: which filters, which tabs, which routes |
| The six ad-hoc empty lines | their own in-card layout; S1 keeps them (§11.6) |

### 4.3 Skeleton decision

A state block never loads: the loading shape belongs to the page or list that owns the request, and every occurrence above already has one
(§3.2, column "Skeleton associated"). Shipping `AppState.Skeleton` would be dead code, and drawing a pictogram skeleton would violate
[`skeletons.md`](../rules/skeletons.md) ("a bone may never stand for a whole card or section"). So `app-state` is the **third registry exception**:
`src/components/no-skeleton.json`, same shape as `headless.json`, one entry with a reason and this issue URL. The guard skips only the skeleton
requirement(s) for the platforms a listed folder implements; it still requires the web entry, the variants, the contract and a test.

---

## 5. Public API (exact)

### 5.1 Subpath and files

| Path | Contents |
| --- | --- |
| `@radandevist/radan-ui/app-state` | `ErrorState`, `EmptyState` and their parts; the types |
| `packages/radan-ui/src/components/app-state/app-state.contract.ts` | props types, no runtime, no Base UI / RN types |
| `…/app-state.variants.ts` | the tone map, the ring/tile/title/text/action class strings, the `cva` for the two empty sizes |
| `…/app-state.web.tsx` | the two roots and their parts (`useRender` for the titles) |
| `…/app-state.web.test.tsx` | unit + DOM parity |
| `web-only.json` | one entry: native has no such screens yet |
| `no-skeleton.json` | one entry: a terminal state has no loading shape |

No entry in `tsdown.config.ts`, no export-map change, no new dependency: the `./*` pattern and `scripts/components.ts` discover the folder.

### 5.2 Types and exports

```ts
import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react';

/** The four tints ShopKartOS uses, from the status palette (light and dark come with the tokens). */
export type StateTone = 'info' | 'neutral' | 'warning' | 'danger';

/** A 24-viewBox stroke icon component (Tabler, Lucide, an inline SVG): the block owns size and stroke. */
export type StateIcon = ComponentType<{ className?: string; stroke?: number }>;

export type ErrorStateProps = {
	/** `alert` for a failure (default), `status` for a state that fixes itself (offline). */
	role?: 'alert' | 'status';
} & Omit<ComponentPropsWithoutRef<'div'>, 'role'>;

export type ErrorStatePictogramProps = { icon: StateIcon; tone?: StateTone; className?: string };
export type ErrorStateDetailsProps = { label: ReactNode; children: ReactNode; className?: string };

export type EmptyStateProps = {
	/** `default` (120 px pictogram) or `compact` (96 px, the in-card variant). */
	size?: 'default' | 'compact';
} & ComponentPropsWithoutRef<'div'>;

export type EmptyStatePictogramProps = {
	icon: StateIcon;
	/** Applied to the glyph, the one documented override (the success tint today). */
	className?: string;
};
```

Every part also takes `className` and its element's props. The titles take Base UI's `render`, exactly as `Card.Header.Label` does, so a caller can pick
the element and keep the look:

```ts
export type ErrorStateTitleWebProps = { children: ReactNode; className?: string; render?: useRender.ComponentProps<'h1'>['render'] };
export type EmptyStateTitleWebProps = { children: ReactNode; className?: string; render?: useRender.ComponentProps<'h2'>['render'] };
// defaults: h1 (ErrorState, mt-4 text-xl) and h2 (EmptyState, mt-3 text-lg / text-base compact).
// `ref` and `tabIndex` pass through: PublyApp focuses the title after an error navigation today.
```

The compound objects:

```tsx
export const ErrorState = Object.assign(ErrorStateRoot, {
	Pictogram: ErrorStatePictogram,
	Title: ErrorStateTitle,
	Description: ErrorStateDescription,
	Actions: ErrorStateActions,
	Details: ErrorStateDetails,
});

export const EmptyState = Object.assign(EmptyStateRoot, {
	Pictogram: EmptyStatePictogram,
	Title: EmptyStateTitle,
	Text: EmptyStateText,
	Actions: EmptyStateActions,
});
```

There is **no boolean prop anywhere**. `role`, `tone` and `size` are string unions (real attributes / a layout scale); the presence of a part is the
caller's JSX, never a flag.

### 5.3 Composition — exactly the ShopKartOS screens

404 (`NotFoundState`, E9–E14):

```tsx
<ErrorState>
	<ErrorState.Pictogram icon={IconZoomQuestion} tone="neutral" />
	<ErrorState.Title>{heading}</ErrorState.Title>
	<ErrorState.Description>{t('error-screen.not-found-text')}</ErrorState.Description>
	<ErrorState.Actions>
		<RetryButton onClick={() => void router.invalidate()} />
		<BackButton to={back} />
	</ErrorState.Actions>
</ErrorState>
```

Offline (E4) — the only `role="status"` and the only auto-retry:

```tsx
<ErrorState role="status">
	<ErrorState.Pictogram icon={IconWifiOff} tone="info" />
	<ErrorState.Title>{t('error-screen.offline-title')}</ErrorState.Title>
	<ErrorState.Description>{t('error-screen.offline-text')}</ErrorState.Description>
	<ErrorState.Actions>…R + B…</ErrorState.Actions>
	<ErrorState.Details label={t('error-screen.details')}>{details}</ErrorState.Details>
</ErrorState>
```

500 / unknown (E7–E8): same with `IconServerOff` / `danger` and `IconAlertTriangle` / `danger`; the description is `t('error.' + message)` or
`error-screen.unknown-text`.

Empty (A3):

```tsx
<EmptyState>
	<EmptyState.Pictogram icon={IconTruckDelivery} />
	<EmptyState.Title>{t('empty.forwarders')}</EmptyState.Title>
	<EmptyState.Text>{t('empty.forwarders-text')}</EmptyState.Text>
	<EmptyState.Actions>
		<Button className="h-11 md:h-9" onClick={openCreate}>…</Button>
	</EmptyState.Actions>
</EmptyState>
```

Compact in a card (A1) — `Card` reused, no new card variant:

```tsx
<Card>
	<Card.Body className="p-0">
		<EmptyState size="compact">
			<EmptyState.Pictogram icon={IconLink} className="text-status-success" />
			<EmptyState.Title>{t('tracking.all-attached')}</EmptyState.Title>
			<EmptyState.Text>{t('tracking.all-attached-text')}</EmptyState.Text>
		</EmptyState>
	</Card.Body>
</Card>
```

### 5.4 What the library takes from each caller

`ErrorState` takes icon, tone, role, the three text slots, the actions and an optional labelled disclosure. `EmptyState` takes icon (+ its one tint),
size, title, text and actions. **No route, no translation, no data, no retry policy.** The action buttons are the caller's `Button` (with `Link`
through `render` where needed) — the block only lays the cluster out.

### 5.5 Versioning

Additive: no shipped state API exists. One changeset, `minor`, `0.15.0`. No deprecation window. `app-state` is in `web-only.json`, so no native
consumer is promised.

---

## 6. Rendering contract

### 6.1 The DOM is the current DOM

The compound parts render **the same elements** as today; a part is not an extra wrapper. The only structural rule is that the `ErrorState` root keeps
its two divs (the 60dvh centring, then the `role` block) and the `EmptyState` root keeps its single div plus the size context (which renders nothing).

| Part | Element | Class string (source of truth, copied verbatim) |
| --- | --- | --- |
| `ErrorState` outer | `div` | `flex min-h-[60dvh] items-center justify-center px-4 py-10` |
| `ErrorState` inner (`role`) | `div` | `flex w-full max-w-sm flex-col items-center text-center` |
| `ErrorState.Pictogram` box | `div` `aria-hidden` | `relative grid size-36 place-items-center` |
| rings | `span` ×2 | `absolute inset-0 rounded-full border opacity-30` / `absolute inset-4 rounded-full border opacity-60` + tone `halo` |
| tile | `span` | `relative grid size-16 rotate-[-6deg] place-items-center rounded-control border shadow-raised-control` + tone `tile` |
| glyph | caller's icon | `size-8 rotate-[6deg]`, `stroke={1.75}` |
| `ErrorState.Title` | `h1` (default) | `mt-4 text-xl font-semibold text-balance` |
| `ErrorState.Description` | `p` | `mt-2 text-sm text-pretty text-muted-foreground` |
| `ErrorState.Actions` | `div` | `mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center` |
| `ErrorState.Details` | `details` | `group mt-8 w-full text-left text-xs text-muted-foreground`; summary `flex min-h-11 … [&::-webkit-details-marker]:hidden`; `pre` `max-h-48 … rounded-[10px] …` |
| `EmptyState` root | `div` | `flex flex-col items-center px-4 text-center` + `py-12` / `py-8` |
| `EmptyState.Pictogram` box | `div` `aria-hidden` | `relative` + `size-[120px]` / `size-24` |
| rings | `span` ×2 | `absolute inset-0 rounded-full border bg-card opacity-45` / `absolute rounded-full border bg-card opacity-90` + `inset-3.5` / `inset-3` |
| tile | `span` | `absolute top-1/2 left-1/2 flex -translate-1/2 -rotate-6 items-center justify-center border bg-background shadow-[var(--radan-ui-effect-raised-control)]` + `size-14` / `size-11` + `rounded-control` |
| glyph | caller's icon | `rotate-6` + `size-7` / `size-6` + `text-muted-foreground` (default, overridable) |
| `EmptyState.Title` | `h2` (default) | `mt-3 leading-[1.3] font-semibold text-balance` + `text-lg` / `text-base` |
| `EmptyState.Text` | `p` | `mt-1.5 max-w-[380px] text-pretty text-muted-foreground` + `text-sm leading-normal` / `text-[13.5px] leading-normal` |
| `EmptyState.Actions` | `div` | `mt-5 flex flex-wrap justify-center gap-2` |

Two spellings are kept as they are, not normalised in S1: `shadow-raised-control` (error tile) and `shadow-[var(--radan-ui-effect-raised-control)]`
(empty tile) are the same computed shadow; `rounded-[10px]` in the `<pre>` is not the 11.2 px `rounded-control`. Normalising either is a separate,
pixel-checked cleanup.

### 6.2 Mobile / desktop

Nothing new: the error screen is 60dvh at every width, its action cluster is a full-width column below `sm` and a centred row from `sm`; the empty
block has no breakpoint and its buttons' 44 → 36 px shrink is the caller's (`h-11 md:h-9`). The two oddities (error actions switch at `sm`, the app's
shell switches at `md`; error buttons never shrink) are recorded, not changed (§11.3–§11.4).

### 6.3 The disclosure

`ErrorState.Details` is composed only when there is a raw detail; the label is the caller's string; the content is the caller's `<pre>` body. The
chevron is an inline MIT Tabler `chevron-down` path (`M6 9l6 6l6 -6`, 24 viewBox, stroke 2) — no icon package, no new peer. `group-open:rotate-180`
plus `motion-reduce:transition-none` on the chevron: in ShopKartOS the global `html[data-motion='none'] *` rule already suppresses it, so this is
behaviour-neutral there and correct in PublyApp.

### 6.4 Tokens only

Every colour, radius and shadow above is a `--radan-ui-*` token or its Tailwind utility. No new token, no `--radan-ui-app-state-*` layer: the
pictogram reuses the status palette that `ErrorState` already consumes. `status-success` is the theme's existing colour utility (used by A1).

### 6.5 SSR

Both roots are pure functions (context + `useRender`); no `useEffect`, `window`, `navigator` or `matchMedia`. The error document's theme/motion
re-application stays in ShopKartOS's `RootDocument` (`routes/__root.tsx:49-60`), and the offline listener stays in `ErrorCard`.

---

## 7. Accessibility

| Item | Today | In the block |
| --- | --- | --- |
| Announcement | `ErrorState` wrapper: `role="alert"` by default, `role="status"` for offline; no explicit `aria-live` | same; `role` is a root prop, `aria-live` passes through for PublyApp |
| Heading | `h1` (error), `h2` (empty) | same defaults; `render` lets an inline caller use a `div` without losing the look |
| Pictograms | `aria-hidden` on the box | same |
| Focus | nothing in ShopKartOS; PublyApp moves focus to the title (`titleRef`, `tabIndex={-1}`) | `Title` forwards `ref` and element props; the focus call stays app-side (§11.8) |
| Disclosure | native `<details>` / `<summary>`, 44 px summary, decorative chevron | same |
| Touch targets | 44 px error actions at every width; 44 → 36 px empty actions | unchanged |
| Empty states | no role, no live region | unchanged by default; the root accepts `role`/`aria-live` so a caller can announce a filtered result (§11.9) |
| Reduced motion | the global `none` rule; the chevron rotates | `motion-reduce:transition-none` (no-op in ShopKartOS) |

No focus trap, no `aria-busy` (nothing loads here), no title invented.

---

## 8. Why there is no TanStack Router adapter

`errorComponent` and `notFoundComponent` are router hooks in component form, but they prescribe no props: `ErrorCard` already is an
`errorComponent` (`{ error, reset }`) and `NotFoundState` already is a `notFoundComponent`. The shared block is presentational, so the adapter would
carry exactly three app decisions:

```ts
// stays in ShopKartOS (and later in PublyApp), ~20 lines:
const retry = () => { queryReset.reset(); reset?.(); void router.invalidate(); };
usePageTitle(heading);
const online = useOnline();
```

`router.invalidate()` is one line; `@tanstack/react-query` is not a radan-ui peer and should not become one for it; and the classification contract
(`unauthenticated`, `forbidden`, `*_not_found`, `error.<code>`) is app vocabulary. An `app-state-tanstack-router` headless subpath would add a peer, a
guard exception and a test suite to move those 20 lines. **If and only if** S2 shows PublyApp's glue is identical line for line, extract that hook in
a later minor; it is not part of this phase.

---

## 9. Tests and catalog

| Layer | What | Where |
| --- | --- | --- |
| Unit | every part renders its element and class; default `role="alert"`, `role="status"`; `h1`/`h2` and `render`; tones apply the right status pair; 1.75 / 1.5 strokes; title ref; details toggle and label; empty `size` context reaches every part; `className` on the empty glyph replaces the muted tint; no extra wrapper | `app-state.web.test.tsx` (jsdom) |
| DOM parity | render the eight error/empty compositions with the exact ShopKartOS props and compare normalised `outerHTML` with fixtures captured from `1eeb6f5` (the 4 error tones + `status`, the 2 empty sizes, the details block) | same file, `app-state.parity.test.tsx` |
| Package guards | `conformance`: `app-state` exempt from the two skeleton files, still requires contract/variants/web entry; `headless`-style validation of `no-skeleton.json`; **no `@tanstack/*`, `i18next`, `react-i18next` or `fetch` import under `app-state/`** | `tests/components.test.ts` (owner-approved edit) |
| Catalog | `apps/catalog/pages/app-state.page.tsx`: 4 tones × error (one with details, one `status`), empty default/compact/with actions/success tint, compact inside `Card.Body`; fixed inline SVG icons (the catalog has no Tabler dependency); four baselines from CI | `app-state-light-phone.png`, etc. |
| App S1 visual | captures of all 32 rendered state occurrences (14 error + 18 empty; the signed-out branch of E3 is a redirect, not a screen) at 390×844 and 1440×900, light and dark, before and after on the same seed, masked for clocks/relative dates | new `apps/web/scripts/state-captures.ts` (§10.2) |
| App S1 layout | `pnpm check:layout` = **186/186** before and after: `layoutRoutes` returns 31 entries (28 owner + 3 estimator) × 3 viewports × 2 themes | `apps/web/scripts/layout-check*` |
| App S1 unit | `tests/error-kind.test.ts` unchanged; the app's retry/back wiring covered by the captures | `apps/web/tests` |
| Real app | the offline capture forces `context.setOffline(true)`; the `server` and `unknown` branches are covered by the catalog and the parity fixture, and captured in the app (marked **verify**) if a test seam is accepted (§12) | manual/CI |

Catalog content, in order: 404 (neutral), 403 (warning, home only), offline (`status`, details), server (danger, details), unknown (danger); empty default
with two actions, empty without actions, compact in a card, success tint. No clocks, no randomness.

---

## 10. Migration

### 10.1 radan-ui — R1, one PR

1. Extract the two components into `app-state/` with the class strings above; split `app-state.variants.ts` (tones + geometry) so no file nears 300 lines.
2. Remove the i18n call: `ErrorState.Details` takes `label`; nothing else imports `react-i18next`.
3. Remove the Tabler type: `StateIcon`; the chevron becomes an inline SVG.
4. `compact` → `size="default" | "compact"` with an internal context; the two empty sizes keep their exact classes.
5. Add `web-only.json` and `no-skeleton.json` entries; update `tests/components.test.ts` (owner-approved shared file) with the exception and the
   no-router/no-i18n guard.
6. Catalog page, unit + parity tests, changeset `minor`, size budget measured after the first build (set 10 % above).
7. Amend [`visual-consistency.md`](../rules/visual-consistency.md) (the flat/rings sentence) and add a short `DESIGN.md` "State views" pointer in the
   same PR — the rule and the block must not contradict each other on `main`. **Owner approval required.**

### 10.2 ShopKartOS — S1, no visible or behavioural change

**Baseline first**, on `1eeb6f5`: `pnpm check:layout` (must print 186/186), `pnpm test`, and the new `state-captures` run (32 occurrences × 2 widths ×
2 themes; stored with the PR).

Steps, in order:

1. Bump `@radandevist/radan-ui` (exact `0.15.0`).
2. Delete `apps/web/src/components/{error-state,empty-state}.tsx`.
3. Rewrite `error-card.tsx` to compose the block. Nothing else in it changes: `BackTo`, `BackButton`, `RetryButton`, `useOnline`, `classifyError`,
   `errorDetails`, `usePageTitle`, the six branches and their order, the offline listener.
4. Rewrite the 12 `EmptyState`/`FilterEmptyState` render sites mechanically. `HomeEmpty` and `FilterEmptyState` stay as app components (they encode the
   tabs, filters and routes); they now compose the block.
5. The six ad-hoc empty lines (A5, A14–A18) are untouched.
6. No route file, no i18n file, no CSS file, no `router.tsx` change.

Allowed structural changes, each covered by the captures: import paths, `compact` → `size="compact"`, `iconClassName` → `className` on the
`EmptyState.Pictogram`, `details` → `<ErrorState.Details label={t('error-screen.details')}>`. **Nothing observable.**

**Gates, all required:**

- (a) `pnpm check:layout` **186/186** after; the report's route/theme/viewport list is unchanged.
- (b) the 32 before/after captures byte-identical (masks pinned in the script, not per run).
- (c) `pnpm test` green, `tests/error-kind.test.ts` byte-identical.
- (d) `grep` gate: no `~/components/error-state` / `~/components/empty-state` import remains; the radan-ui guard proves the block imports no
  router/i18n.
- (e) the radan-ui parity fixture renders the same normalised HTML as the captured ShopKartOS fixtures.

If a capture differs, the diff is investigated, never masked away; a real difference means the extraction is wrong.

### 10.3 PublyApp — S2

| # | Need | Detail |
| --- | --- | --- |
| P0 | radan-ui bump `0.8.0` → `0.15.0` | separate PR, before anything else; it brings everything from 0.9 to 0.15 (tokens, Card/Button, the phase-1 blocks) |
| P1 | Replace `StateView`'s markup with the block | keep `StateView`, `StateSurface`, `ErrorStateSurface`, `NoMatchStateSurface` as thin wrappers, so the ~75 call sites do not move; map `presentation="empty"` to `EmptyState` and `presentation="status" && scale="page"` to `ErrorState` |
| P2 | Inline-scale surfaces (18 today, empty and status mixed) | not expressible by the two roots as scoped; compose `ErrorState.Pictogram/Title/Description/Actions` inside PublyApp's own inline container, or keep the local markup in P1 and migrate later. **Decision for S2** (§11.12) |
| P3 | Keep the focus behaviour | `Title` ref + `tabIndex={-1}`; the focus call stays in `AppErrorView` |
| P4 | Keep `aria-live` | pass through on the root |
| P5 | `primary` tone | map to `info` in the wrapper; adding a fifth tone is a separate, token-backed minor |
| P6 | Full-page size | PublyApp's `min-h-screen` becomes the block's `min-h-[60dvh]`: a visible S2 change, accepted as "the block is the reference", or a documented exception (§11.12) |

Gates for S2: PublyApp's own test suite, its visual/proof captures before/after, and the same "no i18n/router in the block" guard.

---

## 11. What in ShopKartOS should not be copied as it is

The owner asked to be corrected where "ShopKartOS as it is today" is the wrong reference. None of these is changed by S1.

1. **`radandevist/shopkart-os#327` — "Try again" is the primary action on a 404.** `NotFoundState` (`error-card.tsx:83-88`) puts `RetryButton` (default variant) before the
   back link, although a missing page is not a transient failure. *Recommendation: after S1, a separate app PR swaps the variants so the back action is
   primary; the block encodes no order, so nothing in radan-ui changes.*
2. **`visual-consistency.md` forbids the copied look.** Its HARD sentence ("flat (no card, ring, shadow or icon disc)") contradicts the two rings and
   the raised tile that the owner wants promoted. *Recommendation: amend the rule with the 24/11 decision (the pictogram is the shared state look);
   do not flatten the block.*
3. **The action cluster has two heights.** Errors use `h-11 px-4` at every width (`error-card.tsx:21`); empties use `h-11 md:h-9` (44 → 36 px) at
   every empty call site with actions. This breaks the rule's "one height per action cluster". *Recommendation: choose `h-11 md:h-9` in a follow-up; S1 keeps both.*
4. **Two breakpoints in one family.** Error actions become a row at `sm` (640 px) while the app shell switches at `md` (768 px); empty buttons shrink
   at `md`. *Recommendation: align on `md` in the follow-up above; not in S1.*
5. **`compact` is a boolean layout flag.** It does not switch a part off, but it is the kind of flag the composition rule discourages. *Recommendation:
   `size="default" | "compact"` in the shared API (one call site changes, pixels identical).*
6. **"Nothing to confirm" is a bare success line.** `pending-checks-page.tsx:37-42` renders a green line where every other "nothing to show" renders the
   pictogram. *Recommendation: leave it in S1; if it is unified later, that needs a `success` tone — a new look, so an owner call.*
7. **The disclosure prints `error.stack` in production.** `errorDetails()` returns `stack ?? message` (`lib/error-kind.ts:36-37`), so a server path,
   a file path or an internal message can reach the user. *Recommendation: keep the disclosure, but show the message only in production (app-side).*
8. **No focus management on the error or 404 screen.** The heading is not focused and the document swap (E1) can drop focus to the body (**verify**). PublyApp already
   focuses its title. *Recommendation: the block exposes `Title`'s ref (done); the app moves focus on mount in S2.*
9. **Empty states are silent.** No `role`, no live region, so a filter that empties a list is not announced. *Recommendation: the root accepts
   `role`/`aria-live`; opt in where it matters, rather than changing every empty at once.*
10. **The disclosure label is inside the component.** `error-state.tsx:78` calls `t('error-screen.details')`, the one i18n leak. *Recommendation: a
    `label` prop in the block; the app passes its key.*
11. **Two code paths to the same 404.** Each entity route both throws `notFound()` in the loader and re-checks the entity in the component
    (E10/E11, E13/E14). Harmless, but the capture list must include both. *Recommendation: keep; the component guard covers a cached `homeQuery`.*
12. **PublyApp's adoption is not pixel-neutral by construction.** Its `StateView` uses SVG circles and its own CSS (same geometry, different DOM), a
    `min-h-screen` page scale, a `primary` tone absent from the four, and 18 inline-scale surfaces the two roots cannot express. *Recommendation:
    accept a visible `60dvh` change (the block is the reference), map `primary` → `info`, and migrate inline status in a later minor; do not add a
    `scale`/`presentation` flag to force it now.*

---

## 12. Risks

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| Pixel drift in the ShopKartOS extraction | medium / high | the class strings move verbatim; DOM-parity fixture; 32 before/after captures; 186/186 layout-check |
| A call site keeps an old local component and the screens diverge | low / medium | delete both files; import gate; the 12 render sites counted in §3.2 |
| The `no-skeleton.json` exception weakens the guard | low / low | same validation as `headless.json` (existing folder, reason, issue, web entry, test); one folder only |
| The rule amendment is forgotten and `main` contradicts itself | medium / medium | the rule + `DESIGN.md` change land in R1, same PR; owner approval listed as a gate |
| Unifying the six ad-hoc lines later changes the look | low / low | explicitly out of S1/S2; a `success` tone would be a new, owner-approved variant |
| PublyApp's inline error surfaces have no shared home | medium / medium | compose the parts inside the local container, or keep the local markup; a `scale` prop is a documented follow-up, not a silent fork |
| The full-page `min-h-screen` → `60dvh` change for PublyApp is rejected late | medium / medium | raised before P1; either accept or record the one documented exception |
| The stack kept in the disclosure leaks internals | low / medium | §11.7, app-side gate, independent of the block |
| Docs ship in the npm tarball (`docs/` is copied by `prepack`) | certain / negligible | same as the other specs |

---

## 13. Rollout summary

**radan-ui:** R1 `app-state` (two roots, catalog, tests, guards, rule amendment) → release `0.15.0`.
**ShopKartOS:** baseline → S1 (delete the two local components, compose the block, 186/186 + 32 captures identical) → then the `#327` / action-size
follow-ups as separate PRs.
**PublyApp:** P0 bump → P1 wrappers + page/collection states → P2 inline status (separate minor if a `scale` is ever justified).

Bump order everywhere: radan-ui first, apps second. Each radan-ui PR carries its changeset, its catalog captures (CI baselines) and `Refs #92`.

## 14. Decisions recorded, open questions

1. **Owner decision 24/11, binding: copy ShopKartOS verbatim.** One `app-state` block, two compound roots, one shared look; no redesign.
2. **The rule yields, not the block.** `visual-consistency.md` is amended in R1 (owner approval), because the copied look is the decision.
3. **No TanStack Router adapter in phase 2** (§8). The router-bound 20 lines stay app-side; extract only if S2 proves them identical.
4. **No skeleton for a terminal state**; `no-skeleton.json` exception, same shape as `headless.json`.
5. **`shopkart-os#327` is not fixed by S1**; it is a separate app PR after the block lands.
6. **PublyApp S2 scope**: page-level errors and collection empties behind the existing wrappers; inline-scale surfaces and the `primary` tone are
   follow-ups (no `scale`/`presentation` flag added now).
7. **`compact` becomes `size`**; no boolean props in the public API.

Open, for the captain: whether PublyApp's `min-h-screen` full-page errors accept the block's `60dvh` (recommended), or take the one documented
exception; and whether the six ad-hoc empty lines are unified in a later phase (they are not in this one).
