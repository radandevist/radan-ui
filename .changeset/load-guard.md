---
'@radandevist/radan-ui': minor
---

New: the load guard, `@radandevist/radan-ui/load-guard` (web only, no router import, no new dependency). ShopKartOS's "a page never stays on its skeleton" nets, ported as they are.

- **`watchLoad(router, now?)`**: a load pending for 15 s, or a router idle with a page still pending, is revalidated once (`router.invalidate()`); checked every 3 s, when the tab becomes visible and when the network returns. Returns what stops it.
- **`withLoadTimeout(inner, { isLoaderCall, limitMs? })`**: a call `isLoaderCall` accepts that gets no answer in 20 s fails with `Error('load_timeout')`. The caller's abort signals are chained by hand (no `AbortSignal.any`) and a caller's own abort keeps its own error. `isLoaderCall` has **no default**: which calls are loaders is the app's decision.
- **`isServerFnGet`**: ShopKartOS's test, a GET to `/_serverFn/` without the `x-no-load-timeout` header (`NO_LOAD_TIMEOUT`, for a GET that is an action). **`isLoadTimeout(error)`** for a query layer's retry policy. Constants `PENDING_LIMIT_MS`, `FETCH_LIMIT_MS`, `LOAD_TIMEOUT`.
- **`installLoadGuard(router, { isLoaderCall })`**: browser only, idempotent; wraps `window.fetch`, starts `watchLoad`, returns the undo of both. The library does not touch `import.meta.hot`: in dev call `import.meta.hot?.dispose(undo)`.

Presenting `load_timeout` (French or English copy, the retry button) stays in the app.
