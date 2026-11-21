// @vitest-environment jsdom
import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPageTransitions } from './page-transition-tanstack-router.web';

/**
 * The contract with the REAL pinned router (an exact dev dependency): the private shapes the adapter reads, and the
 * call counts it relies on. ShopKartOS's swap tests use a hand-made router, so a TanStack bump that changes an internal
 * passes them; this one fails. Limits: jsdom has neither `startViewTransition` nor `CSS.supports`, so both are stubbed,
 * and the stub runs its update callback on a microtask, not at the browser's deferred next frame: the stale-swap rules
 * rest on the unit tests (a deferred stub) and on `nav-stress` in real Chromium.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The stub every test shares (the core wraps `document.startViewTransition` once per document).
type Update = () => Promise<void> | void;
const started: (Update | { update: Update })[] = [];
const stubStart = (arg: Update | { update: Update }) => {
	started.push(arg);
	const update = arg instanceof Function ? arg : arg.update;
	const done = Promise.resolve().then(() => update());
	return { updateCallbackDone: done, finished: done, ready: done, skipTransition: () => {} };
};

beforeAll(() => {
	Object.defineProperty(document, 'startViewTransition', { configurable: true, writable: true, value: stubStart });
	Object.defineProperty(window, 'CSS', { configurable: true, value: { supports: () => true } });
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
	});
	localStorage.setItem('radan-ui:page-transition', 'material');
});
afterAll(() => vi.restoreAllMocks());
beforeEach(() => void (started.length = 0));

const Skeleton = () => null;
const Page = () => null;

/** A router with a page behind a slow loader (with a skeleton), a cached one, a slow root `beforeLoad` on demand. */
const build = ({ rootDelay = 0, skeleton = true } = {}) => {
	const transitions = createPageTransitions();
	const options = transitions.routerOptions;
	const types = vi.fn<typeof options.defaultViewTransition.types>(options.defaultViewTransition.types);
	options.defaultViewTransition.types = types;
	const root = createRootRoute({ beforeLoad: () => (rootDelay ? sleep(rootDelay) : undefined) });
	const index = createRoute({ getParentRoute: () => root, path: '/', component: Page });
	const slow = createRoute({
		getParentRoute: () => root,
		path: '/slow',
		component: Page,
		...(skeleton && { pendingComponent: Skeleton }),
		loader: () => sleep(250),
	});
	const cached = createRoute({ getParentRoute: () => root, path: '/cached', component: Page });
	const router = createRouter({
		routeTree: root.addChildren([index, slow, cached]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		...options,
	});
	return { router, transitions, types, dispose: transitions.install(router) };
};

describe('the adapter on the real router', () => {
	it('installs, publishes its health for tools, and undoes itself', async () => {
		const { router, transitions, dispose } = build();
		await router.load();
		expect(transitions.health()).toEqual({ earlyOffer: 'untested' });
		expect(window.__radanUiPageTransitions).toEqual({ earlyOffer: 'untested' });
		expect(router.options.defaultPendingMs).toBe(0);
		dispose();
	});

	it('builds the early skeleton from the private load transaction when the root beforeLoad is slow', async () => {
		const { router, transitions, dispose } = build({ rootDelay: 400 });
		await router.load();
		void router.navigate({ to: '/slow' });
		await sleep(200);
		// 80 ms after the click the page's skeleton is on screen, though the root's beforeLoad has not answered.
		expect(transitions.health().earlyOffer).toBe('ok');
		expect(router.stores.matches.get().some((match) => match.routeId === '/slow' && match.status === 'pending')).toBe(
			true,
		);
		await sleep(700);
		expect(router.state.status).toBe('idle');
		dispose();
	});

	it('reports no-pending-component, not a failure, when no route has a skeleton', async () => {
		const { router, transitions, dispose } = build({ rootDelay: 400, skeleton: false });
		await router.load();
		void router.navigate({ to: '/slow' });
		await sleep(200);
		expect(transitions.health().earlyOffer).toBe('no-pending-component');
		await sleep(700);
		dispose();
	});

	it('shows no skeleton for a cached page and plays one view transition for it', async () => {
		const { router, transitions, dispose } = build();
		await router.load();
		await router.navigate({ to: '/cached' });
		await sleep(150);
		expect(started).toHaveLength(1);
		expect(transitions.health().earlyOffer).toBe('untested');
		dispose();
	});

	it('plays exactly one view transition for a slow page, deciding once for the same location object', async () => {
		const { router, types, dispose } = build();
		await router.load();
		await router.navigate({ to: '/slow' });
		await sleep(50);
		expect(started).toHaveLength(1);
		// The swap's `types` and the commit's got the SAME `toLocation`: the first animated, the second was a plain update.
		const forSlow = types.mock.calls.flatMap(([info], index) =>
			info.toLocation.pathname === '/slow' ? [{ at: info.toLocation, result: types.mock.results[index]?.value }] : [],
		);
		expect(forSlow).toHaveLength(2);
		expect(forSlow[1]?.at).toBe(forSlow[0]?.at);
		expect(forSlow.map((call) => call.result)).toEqual([['fade'], false]);
		dispose();
	});

	it('leaves navigate({ viewTransition: false }) unspent by the swap: no view transition at all', async () => {
		const { router, dispose } = build();
		await router.load();
		await router.navigate({ to: '/slow', viewTransition: false });
		await sleep(50);
		expect(started).toHaveLength(0);
		expect(router.state.status).toBe('idle');
		dispose();
	});

	it('is idempotent per router', async () => {
		const { router, transitions, dispose } = build();
		expect(transitions.install(router)).toBe(dispose);
		dispose();
	});
});

/** A router on a fresh instance of the adapter, NOT installed yet. */
const unInstalled = (transitions: ReturnType<typeof createPageTransitions>) => {
	const root = createRootRoute();
	const index = createRoute({ getParentRoute: () => root, path: '/', component: Page });
	const slow = createRoute({
		getParentRoute: () => root,
		path: '/slow',
		component: Page,
		pendingComponent: Skeleton,
		loader: () => sleep(100),
	});
	return createRouter({
		routeTree: root.addChildren([index, slow]),
		history: createMemoryHistory({ initialEntries: ['/'] }),
		...transitions.routerOptions,
	});
};

/** One slow navigation: how many view transitions the document saw. */
const slowNavigation = async (router: ReturnType<typeof unInstalled>) => {
	started.length = 0;
	await router.navigate({ to: '/slow' });
	await sleep(50);
	const count = started.length;
	await router.navigate({ to: '/' });
	await sleep(50);
	return count;
};

describe('per-router state', () => {
	it('two routers built before either installs each play one view transition per navigation', async () => {
		const transitions = createPageTransitions();
		const first = unInstalled(transitions);
		const second = unInstalled(transitions);
		// Installed in the order that a "last routerOptions read" would get wrong.
		const undoFirst = transitions.install(first);
		const undoSecond = transitions.install(second);
		await first.load();
		await second.load();
		expect(await slowNavigation(first)).toBe(1);
		expect(await slowNavigation(second)).toBe(1);
		undoFirst();
		undoSecond();
	});

	it('dispose then install again on the same router (HMR) still plays one view transition per navigation', async () => {
		const transitions = createPageTransitions();
		const router = unInstalled(transitions);
		transitions.install(router)();
		// Another router read `routerOptions` meanwhile: the re-install must still find its own state.
		unInstalled(transitions);
		const undo = transitions.install(router);
		await router.load();
		expect(await slowNavigation(router)).toBe(1);
		undo();
	});
});

// The PublyApp-shaped checks (spec §13): a module-level instance, a per-request router twice in one process, the server.
describe('the PublyApp shape', () => {
	it('one module-level instance builds two routers, each with its own state', async () => {
		const transitions = createPageTransitions({ isTopLevel: ({ path }) => path.split('/').length <= 3 });
		const make = () => {
			const root = createRootRoute();
			const router = createRouter({
				routeTree: root.addChildren([createRoute({ getParentRoute: () => root, path: '/', component: Page })]),
				history: createMemoryHistory({ initialEntries: ['/'] }),
				...transitions.routerOptions,
			});
			return { router, dispose: transitions.install(router) };
		};
		const first = make();
		const second = make();
		expect(second.dispose).not.toBe(first.dispose);
		first.dispose();
		second.dispose();
	});
});
