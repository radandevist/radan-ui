# Shared error pages and empty states — design (phase 2 of the shared app blocks)

Status: DRAFT for implementation, 2026-11-24; the owner decisions of 24/11 are recorded in §14. Tracks [radan-ui#92](https://github.com/radandevist/radan-ui/issues/92), the phase 2 announced by [radan-ui#80](https://github.com/radandevist/radan-ui/issues/80) and the phase-1 spec [`2026-11-21-page-transitions-design.md`](./2026-11-21-page-transitions-design.md).

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
   plain elements, `rounded-control`, `shadow-raised-control` and the `--radan-ui-status-*` tokens. They import no router, no fetch, no app module. The
   non-shared dependencies are (a) the i18n string `error-screen.details` inside `ErrorState`, (b) the caller-supplied Tabler icon, and
   (c) `cn` from `~/lib/utils` (`empty-state.tsx:4`). The first two leave cleanly (label as a prop, icon as a prop); `cn` maps to radan-ui's
   `../../lib/cn` (§4.2).
2. **The same pictogram already exists a second time.** PublyApp's `state-view.tsx` re-implements the same ShopKartOS pictogram family (two rings + a
   −6° tilted tile) with its own CSS geometry (tile 18 px empty / 20 px status vs the 14 px `rounded-control`; inner ring 45.5 px vs 46 px; its own
   shadow token), with the comment "Both are the ShopKart OS pictogram (owner decision 04/11)" — and it uses one component for empty and error, page and inline.
   That is both proof the look is cross-app and the best prior art for the API (Title ref, `role`, `aria-live`). ShopKartOS itself redraws the tilted
   tile a third time in `EmptyVisit` (`next-visit-card.tsx:89-91`, one tile, no rings, inside its own card; §11.13).
3. **One radan-ui HARD rule forbade the copied look; the owner decided on 24/11 to amend the rule, not the look.**
   [`visual-consistency.md`](../rules/visual-consistency.md) says empty and error states must be "flat (no card, ring, shadow or icon disc)" and
   "at one visual scale". ShopKartOS's states are two rings and a raised tilted tile at three scales. Copying verbatim means **amending the rule**,
   not restyling the block (§11.2). Decided 24/11: the amended rule describes the current ShopKartOS rendering, which becomes the shared look; no
   further owner decision blocks R1.

Consequence — the plan is:

- **S0 (ShopKartOS)** — capture harness only: `state-captures.ts`, the dev/test `/state-capture` seam and the two scripts. No visual change; it
  lands first because it writes the 39 app snapshots and the eight block fixtures that S1 and R1 compare against (§9.1, §10.2).
- **R1 (radan-ui)** — one web-only subpath, `@radandevist/radan-ui/app-state`, holding two compound roots (`ErrorState`, `EmptyState`) that share one
  variants file and therefore one look. No i18n, no router, no fetch, no new icon dependency, no skeleton (a terminal state has no loading shape, §4.3).
  A catalog page and unit + parity tests against S0's eight block fixtures. Minor release `0.15.0`.
- **S1 (ShopKartOS)** — delete its two local components, compose the shared parts, keep every text, action, route and behaviour. Gates: `layout-check`
  186/186 and before/after captures of every state identical (§10.2).
- **S2 (PublyApp)** — adopt the block for its page-scale error views behind its existing `StateView`/`AppErrorView` wrappers (§10.3); the inline-scale
  surfaces (including every collection empty) and the four page-scale auth views (two confirmations, two error/status views) stay local until a later minor.

**No TanStack Router adapter is needed** (§8): `errorComponent` / `notFoundComponent` accept any component, and the only router-bound line —
`router.invalidate()` — belongs with the app's query reset and `reset()`, not in a peer dependency.

---

## 2. Goals, non-goals, anti-goals

### Goals

1. One shared block renders ShopKartOS's error and empty states **pixel-identically**: same geometry, same type scale, same tones, same action cluster,
   same disclosure.
2. Compound components composed through `children`; no boolean that switches a part on or off, no `variant`/`presentation`/`embedded` flag soup.
3. Zero i18n, zero router, zero fetch and zero browser-only effect in the block. Every text, icon, tone and action comes from the caller.
4. One element, one aspect, everywhere the block is used: the class strings live once in `app-state.variants.ts`; an app cannot get a different size, radius or tone by accident. The 13 ad-hoc collection-level empties of §3.2 are explicit app-side exceptions (§11.6, §11.13), not per-page copies of the block.
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
collection-level empty state. A state mounted in several equivalent places counts once and its mounts are listed in Source; a different layout
variant (the next-visit card's aside and feed placements) counts separately. Adjacent inline surfaces are listed separately and are **out of the
block's scope**. That gives **23 error occurrences (15 page-level + 8 inline)** and **39 empty occurrences (25 collection-level + 14 inline)**,
plus nine `InlineEdit` fields carrying ten `empty`/`placeholder` props that are not states (§3.2).

Legend: **P** = page scale (`min-h-[60dvh]`, centred), **I** = inline (no min-height), **C** = compact. **R** = retry (primary), **B** = back (outline
unless stated), **H** = home (primary, 403 only), **D** = "Technical details" disclosure. All actions are `Button` from radan-ui; all strings are
`react-i18next` keys in `i18n/locales/{en,fr}.json`.

### 3.1 Error pages and cards

**Mount points (2).**

| # | Mount | Source | What changes |
| --- | --- | --- | --- |
| E1 | Root `errorComponent` (the locale read or the root itself failed) | `routes/__root.tsx:37-43,127` | Wrapped in a fresh `RootDocument`: the document is swapped, the shell is gone; `THEME_SCRIPT` / `MotionScript` re-apply (§6.5). |
| E2 | Router `defaultErrorComponent` (any page's load failed) | `router.tsx:45` | Rendered inside the app shell, so the rail/top bar remain; the page title is published by `usePageTitle`. |

E2 is the mount for E4–E8 and has no render of its own: the capture manifest keeps one E2 entry asserting the shell and the branch entries assert
`data-kind` + heading (§9.1).

**`ErrorCard` kinds (5 screens + 1 redirect).** The component is `error-card.tsx:98-208`; the classifier is `lib/error-kind.ts:18-33`.

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

**Collection-level states (25).**

| # | Site | Pictogram | Title / text | Actions | Scale | Skeleton associated | Layout (phone → desktop) | A11y | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Tracking, "unknown parcels" all attached | `IconLink`, success tint | `tracking.all-attached` / `tracking.all-attached-text` | none | **C** | `TrackingPageSkeleton` (`routes/forwarders.tracking.tsx:24`) | inline in `Card.Body p-0` | `h2`, no role | `tracking-page.tsx:118-123` |
| A2 | Forwarders, filter hides all | `IconSearch` | `empty.no-match-filter` / `-text` | Clear filter (outline) | I | `ForwardersListSkeleton` (`routes/forwarders.index.tsx:13`) | py-12, button 44→36 | `h2` | `forwarders-list.tsx:181` |
| A3 | Forwarders, none at all | `IconTruckDelivery` | `empty.forwarders` / `-text` | New forwarder (primary) | I | same | py-12, New forwarder button 44→36 | `h2` | `forwarders-list.tsx:184-190` |
| A4 | Pending checks, filter hides all | `IconSearch` (via `FilterEmptyState`) | `empty.no-match-filter` / `-text` | Clear filter | I | `PendingChecksPageSkeleton` (`routes/pending-checks.tsx:13`) | py-12, 44→36 | `h2` | `pending-checks-page.tsx:34` |
| A5 | Pending checks, none at all | `IconCircleCheck` | `check.none` ("Nothing to confirm") | none | — | same | a plain success line, `text-sm text-status-success` | none | `pending-checks-page.tsx:37-42` |
| A6 | Home, no item in the org | `IconPackage` | `empty.no-items` / `-text` | New estimate (primary) | I | `HomeSkeleton` (`routes/index.tsx:48`) | py-12, 44→36 | `h2` | `home-empty.tsx:74-81` |
| A7 | Home, search/filter hides all | `IconFilterOff` | `empty.no-match` + composed `empty.nothing-for` / `-no-result` / `-with-filters` / `-in-tab` | Clear (primary) + "search every tab" (outline) | I | same | py-12, 44→36 | `h2` | `home-empty.tsx:91-111` |
| A8 | Home, empty tab | tab icon (`evaluate` sparkles, `progress` truck, `done` check, `rejected` x, `all` package) | `empty.tab-title` / `empty.tab-{tab}` | New estimate (evaluate only) + see all (outline) | I | same | py-12, 44→36 | `h2` | `home-empty.tsx:113-125` |
| A9 | Pickups, filter hides all | `IconSearch` | `pickups.no-match-title` / `-text` | Clear filters (outline) | I | `PickupsPageSkeleton` (`routes/pickups.index.tsx:13`) | py-12, 44→36 | `h2` | `pickups-feed.tsx:119-130` |
| A10 | Pickups, no past pickup | `IconReceipt` | `pickups.no-past-title` / `-text` | none | I | same | py-12 | `h2` | `pickups-feed.tsx:131` |
| A11 | Pickup / visit, no item in the table | `IconPackageOff` | `empty.pickup-items` / `-text` | none | I | `PickupPageSkeleton` / `VisitPageSkeleton` (the table's `ItemsTable.Skeleton`) | inside the table's empty cell, sticky-left wrapper | `h2` inside the `td` | `pickup-items-table.tsx:64` |
| A12 | Inbox (desktop drawer and phone sheet) | `IconBellCheck` | `notification.empty.title` / `-text`, or `notification.empty-read.title` / `-text` when unread is empty but the all list is not | none | I | `InboxList.Skeleton` (`inbox-list.tsx:89-96`) | same block; drawer vs sheet is the container | `h2` | `inbox-list.tsx:100-104` |
| A13 | Tracking, never synced | `IconRadar2` | `tracking.empty-title` / `-text` | Sync now (default, `disabled` + `aria-busy` while syncing) | I | `TrackingPageSkeleton` | py-12, 44→36 | `h2` | `tracking-page.tsx:214-219`; button `:190-198` |
| A14 | `ItemsTable` fallback, when a caller passes no `empty` | none | `table.no-match` | none | — | parent page | `py-10 text-center text-sm text-muted-foreground` | none | `items-table.tsx:94` (no current caller relies on it: Home and the pickup table pass `empty`; **fixture**, not a browser capture) |
| A15 | `/admin`, no client space | none | `admin.spaces-empty` | none | — | `AdminPageSkeleton` (`routes/admin.tsx:18`) | plain line in a `Card.Body` | none | `spaces-section.tsx:161-163` |
| A16 | `/admin`, no other shop account | none | `admin.shop-owners-empty` | none | — | same | plain line | none | `spaces-section.tsx:198-200` |
| A17 | `/admin`, no global forwarder | none | `admin.global-forwarders-empty` | none | — | same | plain line | none | `global-forwarders-section.tsx:26-28` |
| A18 | `/settings` history, no change | none | `history.empty` | none | — | `ChangesList.Skeleton` while pending | plain line in a `SettingRow` | none | `history-rows.tsx:20-26` |
| A19 | Pickups, Next visit card empty (aside, ≥980 px) — third copy of the tilted tile, out of block | one 56 px tilted tile `IconPackageOff`, no rings | `pickups.nothing-title` / `nothing-text` or `nothing-text-coming` or `waiting-code-text` | Sync (outline) + sync hint; no caller action | — (56 px tile, no rings) | `PickupsPageSkeleton` | framed section, 56 px tile, no rings | `h2` | `next-visit-card.tsx:76-97`; `pickups-page.tsx:123` |
| A20 | Pickups, Next visit card empty (feed placement) — same tile, different card layout | same | same | same | — (56 px tile, no rings) | same | same | `h2` | `next-visit-card.tsx:76-97`; `pickups-page.tsx:150` |
| A21 | Accuracy, "to enter" queue empty | none | `accuracy.to-enter-none` | none | — | `ToEnterSkeleton` (`accuracy-page.skeleton.tsx:35`) | plain line in a `Section` | none | `to-enter.tsx:13-14` |
| A22 | Accuracy, no suggestion | none | `accuracy.no-suggestion` | none | — | `SuggestionListSkeleton` | plain line in a `Section` | none | `suggestion-list.tsx:50-52` |
| A23 | Accuracy, no comparison | none | `accuracy.no-comparison` | none | — | `ComparisonsTableSkeleton` | plain line in a `Section` | none | `comparisons-table.tsx:38-40` |
| A24 | Change log, empty (forwarder history tab, pickup history tab, usage panel) | none | `history.empty` | none | — | `ChangesList.Skeleton` | plain line; the three mounts share it | none | `changes-list.tsx:66-68`; `forwarder-page.tsx:75`, `pickup-page.tsx:92`, `usage-panel.tsx:108` |
| A25 | Item drawer, History tab | none | `history.empty` | none | — | `ChangesList.Skeleton` | plain line in the drawer | none | `item-history.tsx:63-65` |

**Inline empty surfaces (14, out of the block).**

| # | Site | What is shown |
| --- | --- | --- |
| A26 | `features/tracking/components/order-combobox.tsx:115-117` | `tracking.no-order` in the desktop combobox (duplicate of A30) |
| A27 | `features/attachments/components/gallery.tsx:50` | `gallery.empty` line under a loaded, empty gallery |
| A28 | `features/pickups/components/pickup-expenses.tsx:64` | `expense.empty` line above the add button |
| A29 | `features/pickups/components/pickup-items-field.tsx:26` | `pickups.form-items-none` line in a fieldset |
| A30 | `features/tracking/components/order-combobox.tsx:167-169` | `tracking.no-order` in the phone sheet (text at `:168`) |
| A31 | `features/tracking/components/unknown-parcel.tsx:43` | `tracking.no-candidate` in a row |
| A32 | `.../estimation-sheet/competitor-block.tsx:99` | `competitor.empty` note |
| A33 | `.../drawer/competitor-list.tsx:114` | `competitor.empty` line |
| A34 | `.../drawer/item-files.tsx:195` | `drawer.files-empty` (read-only) |
| A35 | `.../drawer/item-files.tsx:198` | `drawer.files-add` dashed dropzone (editable) |
| A36 | `.../estimation-sheet/captures.tsx:110` | `estimation.captures-title` + choose-images dropzone |
| A37 | `.../estimation-sheet/competitor-block.tsx:143-146` | `estimation.calc-empty` dashed note when the sheet has no item |
| A38 | `.../estimation-sheet/calculations.tsx:226-230` | `estimation.calc-empty` dashed note in the calculation block |
| A39 | `features/pickups/components/pickup-codes.tsx:32,62` | `pickups.codes-title-none` / `pickups.codes-none`: the Next visit card's Codes section when pending items still have no code (inline, inside the A19/A20 card) |

**Not states (9 `InlineEdit` fields, 10 props).** `empty`/`placeholder` props: `drawer/tracking-number.tsx:44-45`, `drawer/item-drawer-body.tsx:130,146`,
`drawer/purchase-rows.tsx:75,98,111`, `drawer/estimation-section.tsx:135,177,214`. They are field placeholders, not empty regions.

### 3.3 The numbers

| | Page/collection level | Inline | Total |
| --- | --- | --- | --- |
| Errors | **15** (2 mounts + 6 `ErrorCard` kinds + 6 `NotFoundState` + 1 login) | 8 | 23 |
| Empty states | **25** (12 `EmptyState`/`FilterEmptyState` render sites + 13 ad-hoc) | 14 | 39 |

The block is composed by all **5 `ErrorCard` screens** and the **6 `NotFoundState` call sites** — **11 error surfaces** — and it replaces the **12
`EmptyState`/`FilterEmptyState` render sites**. The 13 ad-hoc collection-level occurrences (A5 and A14–A25) stay app-side in S1 (§11.6, §11.13).
The login error (E15) and the 14 inline surfaces also stay app-side.

---

## 4. What is common, what stays in the app

### 4.1 Common — moves into `@radandevist/radan-ui/app-state`

| Element | Today | Becomes |
| --- | --- | --- |
| Error pictogram: 144 px box, two tinted rings (30 % / 60 %), 64 px tile, −6° / +6°, `stroke 1.75` | `error-state.tsx:29-42` | `ErrorState.Pictogram` |
| Error tones: `info`, `neutral`, `warning`, `danger` → **eight** literal class strings (a halo and a tile each), mapped `info`→`status-open`, `neutral`→`status-closed`, `warning`→`status-pending`, `danger`→`status-breached` | `error-state.tsx:9-26` | `app-state.variants.ts` (one map, §6.6) |
| Error layout: 60dvh centring, `max-w-sm`, `h1` 20 px, 14 px text, action cluster, disclosure | `error-state.tsx:66-89` | `ErrorState` + `.Title` / `.Description` / `.Actions` / `.Details` |
| Empty pictogram: 120 / 96 px, two card rings, 56 / 44 px tile, same tilt | `empty-state.tsx:26-38` | `EmptyState.Pictogram` |
| Empty type scale and spacing: 18 / 16 px title, 14 / 13.5 px text, `max-w-[380px]` | `empty-state.tsx:39-49` | `EmptyState` + `.Title` / `.Text` / `.Actions` |
| Empty sizes: default / compact | `compact` boolean | `size="default" \| "compact"` on the root, read by the parts through context |
| Disclosure geometry and chevron | `error-state.tsx:75-85` | `ErrorState.Details` (the inline MIT Tabler `chevron-down` SVG, markup verbatim in §6.3 — no icon dependency) |

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
| `FilterEmptyState`, `HomeEmpty`, `EmptyVisit`, the accuracy/changes/item-history lines | app compositions: which filters, tabs, routes and card frame; the 13 ad-hoc collection-level empties stay app-side in S1 (§11.6, §11.13) |
| `cn` from `~/lib/utils` | an app alias; the block imports radan-ui's `../../lib/cn` (same signature) |

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
| `…/app-state.web.test.tsx` | unit + DOM parity (one file, not a second `app-state.parity.test.tsx`) |
| `packages/radan-ui/src/components/web-only.json` | one entry: native has no such screens yet |
| `packages/radan-ui/src/components/no-skeleton.json` | one entry: a terminal state has no loading shape |

`web-only.json` and `no-skeleton.json` are **global registries in `src/components/`**, not files inside `app-state/`. `scripts/components.ts`
today reads only `web-only.json` and `headless.json`: R1 adds a `noSkeleton()` reader and uses it in the conformance check (and extends
`tests/components.test.ts`), otherwise the exception is never read and `conformance` still requires a skeleton. No entry in `tsdown.config.ts`,
no export-map change, no new dependency: the `./*` pattern discovers the folder.

### 5.2 Types and exports

```ts
import type { ComponentProps, ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react';

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

Every part also takes `className` and its element's props. **`ErrorState` splits its root props**: `className` and `style` go to the outer
60dvh layout div; `role` (default `alert`), `aria-live`, every `aria-*`, `data-*`, `id` and the remaining div attributes go to the **inner** role div.
There is no wholesale `{...props}` on the outer div — that would move `role`/`aria-live` off the announced block and silently drop the default
`role="alert"`. `EmptyState` has one root div, so all its props land there. The titles take Base UI's `render`, exactly as `Card.Header.Label` does, so a caller can pick
the element and keep the look:

```ts
export type ErrorStateTitleWebProps = {
	children: ReactNode;
	className?: string;
	render?: useRender.ComponentProps<'h1'>['render'];
} & Omit<ComponentProps<'h1'>, 'children' | 'className' | 'render'>;
export type EmptyStateTitleWebProps = {
	children: ReactNode;
	className?: string;
	render?: useRender.ComponentProps<'h2'>['render'];
} & Omit<ComponentProps<'h2'>, 'children' | 'className' | 'render'>;
// defaults: h1 (ErrorState, mt-4 text-xl) and h2 (EmptyState, mt-3 text-lg / text-base compact).
// `ComponentProps<'h1'|'h2'>` keeps `ref`, `tabIndex` and the rest of the element's props; `useRender`
// forwards them, which is what lets PublyApp focus the title after an error navigation.
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

The block imposes no action order: the order above is ShopKartOS's current one, kept by S1. The 24/11 decision on `shopkart-os#327` applies to
**every** `NotFoundState` (E9–E14), not just the root: retry leaves the 404s (it stays on real load errors), the home link becomes primary, and the
contextual `back` link stays as the secondary outline action. For the root (E9, `back="/"`) the existing home link is promoted; for E10–E14 a primary
home link is added before the list back link. It is a separate app PR after S1 (§11.1).

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
| `ErrorState` outer | `div` | `flex min-h-[60dvh] items-center justify-center px-4 py-10` — `className`/`style` land here |
| `ErrorState` inner (`role`) | `div` | `flex w-full max-w-sm flex-col items-center text-center` — `role`, `aria-live`, `aria-*` and the other attributes land here |
| `ErrorState.Pictogram` box | `div` `aria-hidden` | `relative grid size-36 place-items-center` |
| rings | `span` ×2 | `absolute inset-0 rounded-full border opacity-30` / `absolute inset-4 rounded-full border opacity-60` + tone `halo` |
| tile | `span` | `relative grid size-16 rotate-[-6deg] place-items-center rounded-control border shadow-raised-control` + tone `tile` |
| glyph | caller's icon | `size-8 rotate-[6deg]`, `stroke={1.75}` |
| `ErrorState.Title` | `h1` (default) | `mt-4 text-xl font-semibold text-balance` |
| `ErrorState.Description` | `p` | `mt-2 text-sm text-pretty text-muted-foreground` |
| `ErrorState.Actions` | `div` | `mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center` |
| `ErrorState.Details` | `details` | `group mt-8 w-full text-left text-xs text-muted-foreground`; summary `flex min-h-11 cursor-pointer list-none items-center justify-center gap-1 select-none [&::-webkit-details-marker]:hidden`; `pre` `max-h-48 overflow-auto rounded-[10px] border bg-card p-3 font-mono text-[11px] leading-4 whitespace-pre-wrap break-all` |
| chevron (inside that summary) | `svg` `aria-hidden="true"`, `xmlns`, width/height 24, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth={2}`, round caps and joins | `tabler-icon tabler-icon-chevron-down size-3.5 transition-transform group-open:rotate-180` (full markup in §6.3); one path `M6 9l6 6l6 -6` |
| `EmptyState` root | `div` | `flex flex-col items-center px-4 text-center` + `py-12` / `py-8` |
| `EmptyState.Pictogram` box | `div` `aria-hidden` | `relative` + `size-[120px]` / `size-24` |
| rings | `span` ×2 | `absolute inset-0 rounded-full border bg-card opacity-45` / `absolute rounded-full border bg-card opacity-90` + `inset-3.5` / `inset-3` |
| tile | `span` | `absolute top-1/2 left-1/2 flex -translate-1/2 -rotate-6 items-center justify-center border bg-background shadow-[var(--radan-ui-effect-raised-control)]` + `size-14` / `size-11` + `rounded-control` |
| glyph | caller's icon | `rotate-6` + `size-7` / `size-6` + `text-muted-foreground` (default, overridable), `stroke={1.5}` |
| `EmptyState.Title` | `h2` (default) | `mt-3 leading-[1.3] font-semibold text-balance` + `text-lg` / `text-base` |
| `EmptyState.Text` | `p` | `mt-1.5 max-w-[380px] text-pretty text-muted-foreground` + `text-sm leading-normal` / `text-[13.5px] leading-normal` |
| `EmptyState.Actions` | `div` | `mt-5 flex flex-wrap justify-center gap-2` |

The strings above are asserted literally by the unit test (the `summary` and `pre` class strings, and the chevron's full attribute set and class string)
and the two strokes are asserted separately (1.75 error, 1.5 empty). A part is not an extra wrapper: copying the table must reproduce the current DOM.

Two spellings are kept as they are, not normalised in S1: `shadow-raised-control` (error tile) and `shadow-[var(--radan-ui-effect-raised-control)]`
(empty tile) are the same computed shadow; `rounded-[10px]` in the `<pre>` is not the 14 px `rounded-control` (`calc(0.625rem × 1.4)`, see
`DESIGN.md:118`). Normalising either is a separate, pixel-checked cleanup.

### 6.2 Mobile / desktop

Nothing new: the error screen is 60dvh at every width, its action cluster is a full-width column below `sm` and a centred row from `sm`; the empty
block has no breakpoint and its buttons' 44 → 36 px shrink is the caller's (`h-11 md:h-9`). The two oddities (error actions switch at `sm`, the app's
shell switches at `md`; error buttons never shrink) are recorded, not changed (§11.3–§11.4).

### 6.3 The disclosure

`ErrorState.Details` is composed only when there is a raw detail; the label is the caller's string; the content is the caller's `<pre>` body. The
chevron is the inline MIT Tabler `chevron-down` SVG, copied with the attributes and classes `IconChevronDown` renders today — no icon package, no new
peer (radan-ui has no Tabler dependency, so the markup is inlined, not imported):

```tsx
<svg
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	strokeWidth={2}
	strokeLinecap="round"
	strokeLinejoin="round"
	className="tabler-icon tabler-icon-chevron-down size-3.5 transition-transform group-open:rotate-180"
	aria-hidden="true"
>
	<path d="M6 9l6 6l6 -6" />
</svg>
```

The `tabler-icon`/`tabler-icon-chevron-down` marker classes are part of the source DOM and stay; the unit test asserts them with the rest of the
attribute set, and the parity fixture compares them. No `motion-reduce:` utility is
added: it is not in the source, it would change the extracted DOM (and the parity fixtures), and reduced motion is already handled by the app's global
`html[data-motion='none'] *` rule (ShopKartOS) / the caller's own motion policy (PublyApp).

### 6.4 Tokens only

Every colour, radius and shadow above is a `--radan-ui-*` token or its Tailwind utility. No new token, no `--radan-ui-app-state-*` layer: the
pictogram reuses the status palette that `ErrorState` already consumes. `status-success` is the theme's existing colour utility (used by A1).

### 6.5 SSR

Both roots are pure functions (context + `useRender`); no `useEffect`, `window`, `navigator` or `matchMedia`. The error document's theme/motion
re-application stays in ShopKartOS's `RootDocument` (`routes/__root.tsx:49-60`), and the offline listener stays in `ErrorCard`.

### 6.6 Tone map (literal)

The four tones each have a **halo** and a **tile** string: eight literal strings in `error-state.tsx:9-26`.
`info`→`status-open`, `neutral`→`status-closed`, `warning`→`status-pending`, `danger`→`status-breached`; there is no `status-info` and no fifth tone.

```ts
info: {
	halo: 'bg-[var(--radan-ui-status-open-background)] border-[var(--radan-ui-status-open-border)]',
	tile: 'bg-[var(--radan-ui-status-open-background)] border-[var(--radan-ui-status-open-border)] text-[var(--radan-ui-status-open-foreground)]',
},
neutral: {
	halo: 'bg-[var(--radan-ui-status-closed-background)] border-[var(--radan-ui-status-closed-border)]',
	tile: 'bg-[var(--radan-ui-status-closed-background)] border-[var(--radan-ui-status-closed-border)] text-[var(--radan-ui-status-closed-foreground)]',
},
warning: {
	halo: 'bg-[var(--radan-ui-status-pending-background)] border-[var(--radan-ui-status-pending-border)]',
	tile: 'bg-[var(--radan-ui-status-pending-background)] border-[var(--radan-ui-status-pending-border)] text-[var(--radan-ui-status-pending-foreground)]',
},
danger: {
	halo: 'bg-[var(--radan-ui-status-breached-background)] border-[var(--radan-ui-status-breached-border)]',
	tile: 'bg-[var(--radan-ui-status-breached-background)] border-[var(--radan-ui-status-breached-border)] text-[var(--radan-ui-status-breached-foreground)]',
},
```

---

## 7. Accessibility

| Item | Today | In the block |
| --- | --- | --- |
| Announcement | `ErrorState` wrapper: `role="alert"` by default, `role="status"` for offline; no explicit `aria-live` | same defaults; `role` and `aria-live` land on the **inner** role div, `className`/`style` on the outer layout div (§5.2), asserted by the parity test |
| Heading | `h1` (error), `h2` (empty) | same defaults; `render` lets an inline caller use a `div` without losing the look |
| Pictograms | `aria-hidden` on the box | same |
| Focus | nothing in ShopKartOS; PublyApp moves focus to the title (`titleRef`, `tabIndex={-1}`) | `Title` forwards `ref` and element props; the focus call stays app-side (§11.8) |
| Disclosure | native `<details>` / `<summary>`, 44 px summary, decorative chevron | same |
| Touch targets | 44 px error actions at every width; 44 → 36 px empty actions | unchanged |
| Empty states | no role, no live region | unchanged by default; the root accepts `role`/`aria-live` so a caller can announce a filtered result (§11.9) |
| Reduced motion | the global `none` rule; the chevron rotates | unchanged: the chevron keeps the source's `transition-transform` (`group-open:rotate-180`), and the app's `html[data-motion='none'] *` rule already suppresses it; the block adds no `motion-reduce:` utility (it is not in the source and would change the DOM) |

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
| Unit | every part renders its element and class; default `role="alert"`, `role="status"`; `h1`/`h2` and `render`; tones apply the right status pair; 1.75 / 1.5 strokes; the exact `summary` and `pre` class strings and the chevron's full SVG attributes; `role`/`aria-live` on the inner div and `className` on the outer; the title `ref` reaches the heading; details toggle and label; empty `size` context reaches every part; `className` on the empty glyph replaces the muted tint; no extra wrapper | `app-state.web.test.tsx` (jsdom) |
| DOM parity | render the **eight block compositions** with the exact ShopKartOS props and compare normalised `outerHTML` with the **eight block fixtures** written by `state:fixtures` from the S0 old components (`1eeb6f5` + harness, §9.1; S0 lands before R1): the 4 error tones + `status`, the 2 empty sizes, the details block | same file, `app-state.web.test.tsx` (one file; no second `app-state.parity.test.tsx`) |
| Package guards | `conformance`: `app-state` exempt from the two skeleton files, still requires contract/variants/web entry; `headless`-style validation of `no-skeleton.json`; **no `@tanstack/*`, `i18next`, `react-i18next` or `fetch` import under `app-state/`** | `tests/components.test.ts` (owner-approved edit) |
| Catalog | `apps/catalog/pages/app-state.page.tsx`: 4 tones × error (one with details, one `status`), empty default/compact/with actions/success tint, compact inside `Card.Body`; fixed inline SVG icons (the catalog has no Tabler dependency); four baselines from CI | `app-state-light-phone.png`, etc. |
| App S1 visual | 36 browser states × 2 widths × 2 themes = **144 PNGs**, plus 3 fixture-only states (E11, E14, A14) whose normalised HTML is the reference: 39 states in total (14 error + 25 collection-level empty; E3 is a redirect; the 14 inline empties A26–A39 are out of scope and not captured). Before/after on the same seed, masked for clocks/relative dates; the manifest is §9.1 | S0 harness `apps/web/scripts/state-captures.ts` (§10.2) |
| App S1 layout | `pnpm check:layout` = **186/186** before and after: `layoutRoutes` returns 31 entries (28 owner + 3 estimator) × 3 viewports × 2 themes | `apps/web/scripts/layout-check*` |
| App S1 unit | `tests/error-kind.test.ts` unchanged; the app's retry/back wiring covered by the captures | `apps/web/tests` |
| Real app | the seam of §9.1 makes `server`, `unknown`, `forbidden`, `not_found` and the root error reachable in dev/test; the offline state is forced with `context.setOffline(true)` | manual/CI |

Catalog content, in order: 404 (neutral), 403 (warning, home only), offline (`status`, details), server (danger, details), unknown (danger); empty default
with two actions, empty without actions, compact in a card, success tint. No clocks, no randomness.

### 9.1 The 39 captured states, and the `server`/`unknown` seam

`state-captures.ts` holds a typed manifest `CAPTURES` with one entry per captured state (E2/E7 are two assertions on the same default-error render,
table below). A unit test asserts `CAPTURES.length === 39`, exactly 14 error
entries, exactly 25 empty entries, and that every row A1–A25 of §3.2 appears once. The 14 inline empties A26–A39 are **not** in the manifest. The manifest is the state → URL/trigger table; the 25 empty
entries point at the §3.2 rows (A19/A20 are separate states because the card layout differs, A24 lists its three mounts).

**Seam and harness (S0, separate PR before S1, no visible change).** The route tree is explicit: `apps/web/vite.config.ts:25` points
`virtualRouteConfig` at `apps/web/src/routes.ts`, and `src/routes/` is not auto-discovered, so S0 must declare
`route('/state-capture', 'state-capture.tsx')` in that manifest **and** add `/state-capture` to `NOT_PAGES` so `layout-routes.test.ts` stays green.
In dev/test, `apps/web/src/routes/state-capture.tsx` throws from its component for `kind=not_found|forbidden|server|unknown`; `kind=root` makes the
root `beforeLoad` throw `state_capture_root` before the shell. Messages: `capture_not_found` (ends `_not_found`), `forbidden`, `load_timeout` (a known
`error.<code>`), `state_capture_unknown` (unknown); `details=1` attaches a stack. The not-found path is that component throw, **not** `notFound()`:
`notFound()` here would render the root `notFoundComponent` (E9), not `ErrorCard`'s `not_found` branch (E5). Outside dev/test
(`!import.meta.env.DEV`) the component **throws** `notFound()` — `notFound()` returns a `NotFoundError` object, never a `ReactNode` — so a direct hit
on `/state-capture` renders the root 404 (E9); the root hook stays inert and no product screen changes. S0 adds a route-render test for that branch with
`DEV` stubbed false (`vi.stubEnv('DEV', false)` or equivalent), asserting the root 404 and no React-child crash. S0 also adds `state-captures.ts`
and the `state:captures`/`state:fixtures` scripts; it keeps the old components, so it is the baseline harness.

**Fixture harness for E11/E14.** A bare `renderToStaticMarkup` of `PickupPage`/`ForwarderPage` throws: both call `useParams`, `useSuspenseQuery(homeQuery())`,
`useTranslation` (and `PickupPage` also `useSearch`/`useNavigate`). Reuse the harness already in `apps/web/tests/skeleton-mirror.test.tsx`: a memory
router declaring `/pickups/$code` (component `PickupPage`, with the route's `validateSearch` for `tab`/`item`) and `/forwarders/$id` (component
`ForwarderPage`), root context `{ queryClient, me }`, `client.setQueryData(['home'], cachedHome([]))` so the entity is absent, `I18nextProvider` with
`createI18n('en')`, then `renderToStaticMarkup`. The test routes deliberately carry no loader and no `notFoundComponent`, so the component guard
(`if (!pickup)` / `if (!forwarder)`) is the branch under test. The two component-guard snapshots are produced there and handed to `state:fixtures`;
they are test/render-only additions and no product route changes.

Every `CAPTURES` entry carries the expected signal for its URL or fixture, and `state-captures.ts` asserts it **before** taking the screenshot; a mismatch fails
the run instead of silently photographing the same 404 thirty-six times. The signal is the `data-kind` value **and** the heading for the `ErrorCard` screens,
the expected heading for the `NotFoundState` screens, and the expected heading/line for the empty states. S0 gives the old `ErrorState` an invisible
`data-kind` attribute on its inner role div (`ErrorCard` passes `kind`, `NotFoundState` does not); S1 keeps it through the block's normal `data-*`
pass-through (§5.2). E5 therefore asserts `[data-kind="not_found"]` — the root `NotFoundState` (E9) carries no `data-kind` — and E9–E14 assert their
exact heading; a missing `/state-capture` route or a wrong heading fails the run. E2 is the router's `defaultErrorComponent` mount; E4–E8 are its
branches. E2 and E7 share `/state-capture?kind=server&details=1`: the E2 entry asserts the app shell (rail/top bar) is present, the E7 entry asserts
`[data-kind="server"]` and its heading — two assertions on the same render, not two renders.

| # | State | Trigger | Expected signal (asserted before capture) |
| --- | --- | --- | --- |
| E1 | root error, document swapped | `/state-capture?kind=root&details=1` | `[data-kind="unknown"]`; heading `page.data-error` ("Could not load the data") |
| E2 | default error inside the shell | `/state-capture?kind=server&details=1` | app shell landmarks present; `[data-kind="server"]` |
| E4 | offline (`role="status"`) | open `/pickups` online, `context.setOffline(true)`, then click `/forwarders` | `[role="status"][data-kind="offline"]`; heading `error-screen.offline-title` ("No connection") |
| E5 | `ErrorCard` not_found | `/state-capture?kind=not_found` | `[data-kind="not_found"]`; heading `page.not-found` ("Page not found") |
| E6 | forbidden | `/state-capture?kind=forbidden` | `[data-kind="forbidden"]`; heading `error-screen.forbidden-title` ("Access denied") |
| E7 | server | `/state-capture?kind=server&details=1` | `[data-kind="server"]`; heading `error-screen.server-title` ("Something went wrong") |
| E8 | unknown | `/state-capture?kind=unknown&details=1` | `[data-kind="unknown"]`; heading `page.data-error` ("Could not load the data") |
| E9 | root `notFoundComponent` | `/__missing__` | no `[data-kind]`; heading `page.not-found` ("Page not found") |
| E10 | pickup loader `notFound()` | `/pickups/__missing__` | no `[data-kind]`; heading `pickup.not-found` interpolated with `__missing__` ("Pickup __missing__ not found") |
| E11 | pickup component guard | **fixture**, not a browser capture: `PickupPage` under the `skeleton-mirror` harness, `['home']` seeded without the pickup | no `[data-kind]`; heading same as E10 |
| E12 | visit component guard | `/pickups/visit/1999-01-01` | no `[data-kind]`; heading `pickups.visit-not-found` ("This visit is no longer expected") |
| E13 | forwarder loader `notFound()` | `/forwarders/__missing__` | no `[data-kind]`; heading `forwarder.not-found` ("Forwarder not found") |
| E14 | forwarder component guard | **fixture**, not a browser capture: `ForwarderPage` under the `skeleton-mirror` harness, `['home']` seeded without the forwarder | no `[data-kind]`; heading same as E13 |
| E15 | login refusal | `/login`, wrong password | `[role="alert"]` with the `login.error.message` line inside the login `Card`; no state pictogram |

The 25 empty states use the same routes with a seed or filter that forces the state: `/` A6–A8; `/forwarders` A2–A3; `/forwarders/tracking` A1 and
A13; `/pending-checks` A4–A5; `/pickups` A9–A10 and A19–A20; `/pickups/<code>` A11; `/notifications` A12; `/accuracy` A21–A23; `/admin`
A15–A17; `/settings`, `/forwarders/<id>`, `/pickups/<code>` and the usage panel A18/A24; the item drawer A25; A14 is the `ItemsTable` fixture.
That mapping plus the error table is the complete 39-entry manifest.

**Snapshot normalisation and server.** Every app snapshot is the normalised `document.body.outerHTML`, taken after the same `settle` as `layout-check`,
with one shared function applied to a **clone for serialisation**: remove every `<script>` and `<link>`, replace every `/assets/...` `src`/`href` with
`assets/asset` (hash and extension dropped), and apply the same clock/relative-date masks as the screenshots. Capturing `<body>` rather than `<html>`
makes E1 independent of the document swap's head and of CSS/JS hashes. The **36 browser states** run against the **Vite dev server**
(`import.meta.env.DEV` true, the only mode where the seam is active), reusing `startServer`'s throwaway database, accounts and seed; `check:layout`
stays on the built `.output` server. The 3 fixture-only states (E11/E14/A14) are rendered in the test harness, and the eight block snapshots are pure
`react-dom/server` renders.

`state-captures.ts --fixtures` writes **two sets**. (1) The 39 app-level normalised snapshots (the E11/E14 component-guard renders and A14 included):
these are the S1 `diff -r` reference. (2) The **eight block-only snapshots**, rendered by `react-dom/server` from the old `ErrorState`/`EmptyState` with
exactly the props of the eight parity compositions (rendered under `I18nextProvider` with `createI18n('en')`, for `error-screen.details`): these are the radan-ui parity fixtures. **S0 lands before
R1**: run both sets in the S0 worktree (old components, `1eeb6f5` + harness), copy the 39 app snapshots to
`packages/radan-ui/src/components/app-state/__fixtures__/shopkart/app/` and the eight block snapshots to `__fixtures__/shopkart/block/`; R1's parity test
consumes the eight block fixtures. Then run the script again after S1 and `diff -r` the 39 app snapshots (after S1 the old components are gone, so
`--fixtures` writes the 39 app snapshots only). The parity test consumes the eight block fixtures, **not** the 39 app snapshots; neither set is hand-copied.

---

## 10. Migration

### 10.1 radan-ui — R1, one PR

**Prerequisite: S0 (§10.2) has landed** and its eight block fixtures are available; R1 must not start before it, because the parity test asserts against
files S0 generates from the old components (`1eeb6f5` + harness). R1 itself has no ShopKartOS dependency at runtime.

1. Extract the two components into `app-state/` with the class strings above; split `app-state.variants.ts` (tones + geometry) so no file nears 300 lines.
2. Remove the i18n call: `ErrorState.Details` takes `label`; nothing else imports `react-i18next`.
3. Remove the Tabler type: `StateIcon`; the chevron becomes the inline Tabler SVG of §6.3 (same attributes and `tabler-icon` classes, no icon package).
4. `compact` → `size="default" | "compact"` with an internal context; the two empty sizes keep their exact classes.
5. Add the `web-only.json` and `no-skeleton.json` entries in `src/components/`; add the `noSkeleton()` reader to `scripts/components.ts` and use it
   in the conformance check; update `tests/components.test.ts` (owner-approved shared file) with the exception and the no-router/no-i18n guard.
6. Catalog page, unit + parity tests (the parity test consumes S0's eight block fixtures, §9.1), changeset `minor`, size budget measured after the first
   build (set 10 % above).
7. Amend [`visual-consistency.md`](../rules/visual-consistency.md) (decided 24/11) and add a short `DESIGN.md` "State views" pointer in the same PR.
   The amendment replaces the whole state sentence: "at one visual scale: flat (no card, ring, shadow or icon disc)" becomes **one family, three
   documented scales — error 144 px (h1 20), empty 120 px (h2 18), compact 96 px (h2 16)** — with the two tinted rings and the tilted tile as the
   shared look, while keeping "the cause in plain words, and the next action offered". The tile's 1px border **and** its raised-control ring are the
   one documented border+ring exception. No further approval; the rule and the block must not contradict each other on `main`.

### 10.2 ShopKartOS — S0 harness, then S1 with no visible or behavioural change

**S0 first — capture harness, separate PR, no visible change.** Add `apps/web/scripts/state-captures.ts`, the
`route('/state-capture', 'state-capture.tsx')` line in `apps/web/src/routes.ts` (§9.1), the dev/test `/state-capture` seam, the invisible
`data-kind` hook, the `state:captures`/`state:fixtures` scripts, and the `NOT_PAGES` entry. The old components stay; this is what makes the baseline
capturable. No product screen changes. S0 lands **before R1** (it has no radan-ui dependency and writes the eight fixtures R1 consumes).

**Baseline first**, on `1eeb6f5` + S0: `pnpm check:layout` (must print 186/186, built app), `pnpm test`, and the new `state:captures` run against the
Vite dev server (36 browser states × 2 widths × 2 themes = 144 PNGs; dev is required because the seam is `import.meta.env.DEV`-only) plus
`state:fixtures` (39 app snapshots + 8 block fixtures); both stored with the PR.

Steps, in order:

1. Bump `@radandevist/radan-ui` (exact `0.15.0`).
2. Delete `apps/web/src/components/{error-state,empty-state}.tsx`.
3. Rewrite `error-card.tsx` to compose the block. Nothing else in it changes: `BackTo`, `BackButton`, `RetryButton`, `useOnline`, `classifyError`,
   `errorDetails`, `usePageTitle`, the six branches and their order, the offline listener, and the S0 `data-kind` hook. S1 keeps the current 404
   action order and labels; the 24/11 `#327` change is a separate app PR after S1 (§11.1).
4. Rewrite the 12 `EmptyState`/`FilterEmptyState` render sites mechanically. `HomeEmpty` and `FilterEmptyState` stay as app components (they encode the
   tabs, filters and routes); they now compose the block.
5. The 13 ad-hoc collection-level empties (A5, A14–A25) are untouched.
6. No product route file, no i18n file, no CSS file, no `router.tsx` change. The dev/test `/state-capture` seam already landed in S0; S1 adds no
   route.

Allowed structural changes, each covered by the captures: import paths, `compact` → `size="compact"`, `iconClassName` → `className` on the
`EmptyState.Pictogram`, `details` → `<ErrorState.Details label={t('error-screen.details')}>`. **Nothing observable.**

**Gates, all required:**

- (a) `pnpm check:layout` **186/186** after; the report's route/theme/viewport list is unchanged.
- (b) the 36 before/after browser captures byte-identical, plus the 3 fixture-only states (E11/E14/A14) identical: **144 PNGs + 39 app HTML
  snapshots**; each capture first asserts its expected signal (§9.1), so E5 (`data-kind="not_found"`), E7 (`server`) and E8 (`unknown`) must be the
  real screens, and E9–E14 must show their exact heading (no `data-kind`), or the gate fails; masks pinned in the script, not per run.
- (c) `pnpm test` green, `tests/error-kind.test.ts` byte-identical.
- (d) import gate: no `~/components/error-state` / `~/components/empty-state` import remains. Lookalike gate: this must print only
  `features/pickups/components/next-visit-card.tsx` (the documented exception §11.13), never a second copy:
  `rg -l --glob '*.tsx' -- '-rotate-6|rotate-\[-6deg\]' apps/web/src | xargs -r rg -l 'shadow-raised-control|radan-ui-effect-raised-control'`
  and the radan-ui guard proves the block imports no router/i18n.
- (e) the radan-ui parity test renders the same normalised HTML as the **eight block fixtures** written by `state:fixtures` from the S0 baseline
  (`1eeb6f5` + harness, §9.1); the 39 app snapshots are the S1 `diff -r` reference; no hand-copied fixture.

If a capture differs, the diff is investigated, never masked away; a real difference means the extraction is wrong.

### 10.3 PublyApp — S2

| # | Need | Detail |
| --- | --- | --- |
| P0 | radan-ui bump `0.8.0` → `0.15.0` | separate PR, before anything else; it brings everything from 0.9 to 0.15 (tokens, Card/Button, the phase-1 blocks) |
| P1 | Map the page-scale error views to the block; leave `StateView`'s own markup intact | keep `StateView`, `StateSurface`, `ErrorStateSurface`, `NoMatchStateSurface` as thin wrappers, so the other **44** product render sites (37 inline: 28 direct `<StateSurface>` + 5 `<ErrorStateSurface>` + 4 `<NoMatchStateSurface>`; plus 7 of the 9 direct `<StateView>` — the 4 auth views and the 3 tenant-picker) do not move; the six test calls and the two occurrences inside the wrapper definitions are not counted. Map the page-scale error views (`AppErrorView`, and `ErrorKindState` when its `scale` is `page` — the other 2 direct `<StateView>` sites) to `ErrorState`. The four page-scale auth views split in two: `EmailSentConfirmation` (`email-sent-confirmation.tsx:30`) and `ResetPasswordSuccess` (`_reset-password-success.tsx:14`) are success/confirmation screens; `InvalidLinkView` (`invalid-link-view.tsx:40`, `warning`) and `PrecheckUnavailableView` (`precheck-unavailable-view.tsx:24`, `danger`, retry) are error/status screens. All four keep the local `StateView` markup in S2 (the two successes would get the block's default `role="alert"`/60dvh; the two errors are deferred with the auth views). The later migration maps the two errors to `ErrorState` page scale with no `min-h-screen`, **never** to `EmptyState`; the two successes, if unified, compose `EmptyState` with the success tint (`text-status-success`), never `ErrorState`. Every `scale="inline"` surface keeps the local markup too (§P2). **One wrapper only**: `AppErrorView` drops its own `min-h-[60dvh] py-10 px-4 max-w-lg` layout when the child is the block; the block root is the 60dvh/max-w-sm/py-10 wrapper. For `embedded={false}`, keep `<main>`/`data-testid` outside and do not re-apply `min-h-screen py-16`: the block root is the only height wrapper (P6 accepts the 60dvh result) |
| P2 | Deferred surfaces: inline-scale (37 product render sites today — 28 direct `<StateSurface>`, 5 `<ErrorStateSurface>`, 4 `<NoMatchStateSurface>`; the six test calls and the two wrapper-definition occurrences excluded — plus the 3 inline tenant-picker `<StateView>`, and the inline `ErrorKindState`) and the four page-scale auth views (two confirmations, two error/status views) | **not in S2**: keep the local markup in P1 and migrate in a later minor. They are not expressible by the two roots as scoped: `StateView` inline renders a `div` title with 24 px horizontal padding and a 15 rem min-height, no 60dvh, while `EmptyState` is `py-12` / `px-4` with an `h2` and `ErrorState` is 144 px / `h1` / 60dvh. A later migration composes `EmptyState` with `EmptyState.Title render={<div/>}` and an explicit root geometry override, never `ErrorState` for an empty; the two auth error/status views are the exception and migrate to `ErrorState` (page, no `min-h-screen`). §11.12, §14.6 |
| P3 | Keep the focus behaviour | `Title` ref + `tabIndex={-1}`; the focus call stays in `AppErrorView` |
| P4 | Keep `aria-live` | pass it as a block prop; `role`/`aria-live` land on the inner role div (§5.2), not on the outer layout div |
| P5 | `primary` tone | map to `info` in the wrapper; adding a fifth tone is a separate, token-backed minor |
| P6 | Full-page size | PublyApp's `min-h-screen` becomes the block's `min-h-[60dvh]`: a visible S2 change, accepted as "the block is the reference". Only the eight `embedded={false}` call sites are affected (`routes/__root.tsx:246,253,271,276,291,295,300`, `routes/login.tsx:354`); the embedded ones are already 60dvh. Add a before/after capture for one of each |

Gates for S2: PublyApp's own test suite, its visual/proof captures before/after, and the same "no i18n/router in the block" guard.

---

## 11. What in ShopKartOS should not be copied as it is

The owner asked to be corrected where "ShopKartOS as it is today" is the wrong reference. None of these is changed by S1.

1. **`radandevist/shopkart-os#327` — "Try again" is the primary action on a 404.** `NotFoundState` (`error-card.tsx:83-88`) puts `RetryButton` (default variant) before the
   back link, although a missing page is not a transient failure. **Decided 24/11:** on **every** 404 (`NotFoundState`, E9–E14) the primary button becomes « Retour à
   l'accueil »; the contextual list back link (`back`) stays as the secondary outline action; « Réessayer » leaves the 404s and stays on real load errors
   (E4/E7/E8). For E9 the existing outline home link is promoted; E10–E14 gain a primary home link. This is a small separate ShopKartOS PR **after S1**.
   S1 keeps the current order and labels (including the retry button), and the block imposes no action order, so nothing in radan-ui changes.
2. **`visual-consistency.md` forbade the copied look; decided 24/11 to amend it.** Its HARD sentence ("flat (no card, ring, shadow or icon disc)")
   and "at one visual scale" contradicted the two rings and the raised tile. *Decided 24/11: the rule is amended to describe the current ShopKartOS
   rendering, which becomes the shared look — one family, three documented scales (error 144, empty 120, compact 96); do not flatten the block.*
3. **The action cluster has two heights.** Errors use `h-11 px-4` at every width (`error-card.tsx:21`); empties use `h-11 md:h-9` (44 → 36 px) at
   every empty call site with actions. This is **not** a broken HARD rule: errors and empties are two different action clusters, each internally
   consistent; it is a family inconsistency to align later. *Recommendation: choose `h-11 md:h-9` in a follow-up; S1 keeps both.*
4. **Two breakpoints in one family.** Error actions become a row at `sm` (640 px) while the app shell switches at `md` (768 px); empty buttons shrink
   at `md`. *Recommendation: align on `md` in the follow-up above; not in S1.*
5. **`compact` is a boolean layout flag.** It does not switch a part off; `composition.md` explicitly allows a layout prop the real element also has
   (`size`, `lines`). It is still a boolean where a string union reads better, not a rule violation. *Recommendation:
   `size="default" | "compact"` in the shared API (one call site changes, pixels identical).*
6. **"Nothing to confirm" is a bare success line.** `pending-checks-page.tsx:37-42` renders a green line where every other "nothing to show" renders the
   pictogram. A1 already renders `EmptyState` with `iconClassName="text-status-success"`, and `status-success` is an existing token (§6.4), so
   **no new `success` tone is needed**: the same compact `EmptyState` covers it. *Recommendation: leave the line in S1; unifying it later is a
   title/text choice, not a token or tone change.*
7. **The disclosure prints `error.stack` in production.** `errorDetails()` returns `stack ?? message` (`lib/error-kind.ts:36-37`), so a server path,
   a file path or an internal message can reach the user. *Recommendation: keep the disclosure, but show the message only in production (app-side).*
8. **No focus management on the error or 404 screen.** The heading is not focused and the document swap (E1) can drop focus to the body (**verify**). PublyApp already
   focuses its title. *Recommendation: the block will expose `Title`'s ref (R1, §5.2); the app moves focus on mount in S2.*
9. **Empty states are silent.** No `role`, no live region, so a filter that empties a list is not announced. *Recommendation: the root accepts
   `role`/`aria-live`; opt in where it matters, rather than changing every empty at once.*
10. **The disclosure label is inside the component.** `error-state.tsx:78` calls `t('error-screen.details')`, the one i18n leak. *Recommendation: a
    `label` prop in the block; the app passes its key.*
11. **Two code paths to the same 404.** Each entity route both throws `notFound()` in the loader and re-checks the entity in the component
    (E10/E11, E13/E14). Harmless, but the gate must cover both: E10/E13 are browser captures, E11/E14 are the two component-guard HTML fixtures
    (§9.1). *Recommendation: keep; the component guard covers a cached `homeQuery`.*
12. **PublyApp's adoption is not pixel-neutral by construction.** Its `StateView` uses SVG circles and its own CSS (same family, own geometry:
    tile radii 18/20 px vs the 14 px `rounded-control`, inner ring 45.5 vs 46 px, its own shadow token; different DOM), a `min-h-screen` page scale,
    a `primary` tone absent from the four, and 37 inline render sites the two roots cannot express. *Recommendation: accept the visible `60dvh`
    change on the page-scale error views (the block is the reference), map `primary` → `info`, and migrate the inline-scale surfaces (empty and
    status alike) and the four page-scale auth views (two confirmations, two error/status views) in a later minor; do not add a
    `scale`/`presentation` flag to force it now.*
13. **The Next visit card redraws the tilted tile.** `next-visit-card.tsx:89-91` has its own 56 px `-rotate-6` tile with `shadow-raised-control`,
    no rings, inside a framed section; it renders twice (aside/feed). It is the third copy of the tile aspect. S1 keeps it: composing
    `EmptyState.Pictogram` would add the two rings and change the look. It is the one documented lookalike exception in the S1 gate; a later design
    pass can extract a `StateTile` part, not S1.

---

## 12. Risks

| Risk | Likelihood / impact | Mitigation |
| --- | --- | --- |
| Pixel drift in the ShopKartOS extraction | medium / high | the class strings move verbatim; DOM-parity fixture; 36 before/after captures + 3 fixtures (144 PNGs); 186/186 layout-check |
| A call site keeps an old local component and the screens diverge | low / medium | delete both files; import gate + lookalike gate; the 12 render sites and 13 ad-hoc exceptions counted in §3.2 |
| The `no-skeleton.json` exception weakens the guard | low / low | same validation as `headless.json` (existing folder, reason, issue, web entry, test); `scripts/components.ts` learns to read it; one folder only |
| The rule amendment is forgotten and `main` contradicts itself | medium / medium | the rule + `DESIGN.md` change land in R1, same PR; decided 24/11, not an approval gate |
| Unifying the 13 ad-hoc collection empties later changes the look | low / low | explicitly out of S1/S2; the success tint already exists (A1), so no new tone |
| PublyApp's inline error surfaces have no shared home | medium / medium | compose the parts inside the local container, or keep the local markup; a `scale` prop is a documented follow-up, not a silent fork |
| The full-page `min-h-screen` → `60dvh` change for PublyApp surprises users | low / medium | accepted in this spec (P6); the eight `embedded={false}` call sites and their before/after captures are named |
| PublyApp's `AppErrorView` keeps its own 60dvh wrapper and doubles the height | medium / medium | P1 makes the block the only wrapper; `embedded={false}` keeps only the `<main>` landmark, with no second height or padding; before/after P6 |
| The stack kept in the disclosure leaks internals | low / medium | §11.7, app-side gate, independent of the block |
| Docs ship in the npm tarball (`docs/` is copied by `prepack`) | certain / negligible | same as the other specs |

---

## 13. Rollout summary

**ShopKartOS:** S0 capture harness + baseline + `state:fixtures` (no visual change) → **radan-ui:** R1 `app-state` (two roots, catalog, tests,
guards, rule amendment; consumes the eight block fixtures) → release `0.15.0` → **ShopKartOS:** S1 (delete the two local components, compose the block,
186/186 + 36 captures + 3 fixture-only states identical) → then the 24/11 `#327` PR (404 primary « Retour à l'accueil ») and the action-size follow-ups
as separate PRs.
**PublyApp:** P0 bump → P1 wrappers + page-scale error views (`ErrorState`) → P2 inline-scale surfaces and the four page-scale auth views (two
confirmations, two error/status views) in a separate minor (no `scale` flag).

Bump order everywhere: radan-ui first, apps second. S0 is the one exception to the app order: it carries no radan-ui dependency and must land before R1
to produce the fixtures R1 asserts against. Each radan-ui PR carries its changeset, its catalog captures (CI baselines) and `Refs #92`.

## 14. Decisions recorded, open questions

1. **Owner decision 24/11, binding: copy ShopKartOS verbatim.** One `app-state` block, two compound roots, one shared look; no redesign. The 13
   ad-hoc collection empties are explicit exceptions (§3.2, §4.2, §11.6, §11.13), not a licence to restyle them.
2. **The rule yields, not the block — Radan's decision of 24/11 (decided).** `visual-consistency.md` is amended in R1 to describe the current
   ShopKartOS rendering: one family, three documented scales (error 144, empty 120, compact 96), two tinted rings and a tilted tile; the tile is the one
   documented border+ring exception. No further approval.
3. **No TanStack Router adapter in phase 2** (§8). The router-bound 20 lines stay app-side; extract only if S2 proves them identical.
4. **No skeleton for a terminal state**; `no-skeleton.json` exception, same shape as `headless.json`, read by `scripts/components.ts`.
5. **`shopkart-os#327` — Radan's decision of 24/11 (decided).** On every 404 (`NotFoundState`, E9–E14) the primary button becomes « Retour à
   l'accueil »; the contextual list back link stays as the secondary outline action; « Réessayer » stays on real load errors only. It is a small
   separate ShopKartOS PR after S1; the block imposes no action order.
6. **PublyApp S2 scope**: the page-scale error views (`AppErrorView`, `ErrorKindState` at `scale="page"`) behind the existing wrappers; the
   inline-scale surfaces — including every collection empty, which `StateSurface` renders at `scale="inline"` — the four page-scale auth views (two
   confirmations, two error/status views), and the `primary` tone are follow-ups (no `scale`/`presentation` flag added now, §10.3 P2). The later
   migration sends the two auth error/status views to `ErrorState` (page, no `min-h-screen`) and the two confirmations to `EmptyState` with the
   success tint.
7. **`compact` becomes `size`**; no boolean props in the public API.

Resolved in this spec: PublyApp's `min-h-screen` full-page errors accept the block's `60dvh` (the block is the reference, P6), and the eight
`embedded={false}` sites are a visible S2 change covered by before/after captures. Still open, for the captain: whether the 13 ad-hoc collection empties
are unified in a later phase (they are not in this one).
