import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SearchRecord } from './page-transition-tanstack-router.contract';
import { createHealth } from './page-transition-tanstack-router.health';
import { earlyOffer } from './page-transition-tanstack-router.internals';
import { shownPath } from './page-transition-tanstack-router.shown-path';
import { createSwapState } from './page-transition-tanstack-router.state';
import { createViewTransition } from './page-transition-tanstack-router.view-transition';

// shownPath: ported from ShopKartOS's `topbar.test.ts` (origin/main), assertions untouched.
describe('shownPath: the header follows the page on screen, not the navigation target', () => {
	const match = (routeId: string, pathname: string) => ({ routeId, pathname });
	it('keeps the old page while its successor loads, whose path the location already holds', () => {
		const state = {
			location: { pathname: '/forwarders' },
			matches: [match('__root__', '/'), match('/pickups', '/pickups/')],
		};
		expect(shownPath(state)).toBe('/pickups');
	});
	it('follows the matches once the next page (or its skeleton) is rendered', () => {
		const state = {
			location: { pathname: '/forwarders' },
			matches: [match('__root__', '/'), match('/forwarders', '/forwarders')],
		};
		expect(shownPath(state)).toBe('/forwarders');
	});
	it('falls back to the location when only the root renders (404) and keeps the home as /', () => {
		expect(shownPath({ location: { pathname: '/nope' }, matches: [match('__root__', '/')] })).toBe('/nope');
		expect(shownPath({ location: { pathname: '/' }, matches: [match('__root__', '/'), match('/', '/')] })).toBe('/');
	});
});

describe('the places the adapter hands to the core', () => {
	afterEach(() => vi.unstubAllGlobals());
	const phone = () => {
		vi.stubGlobal('document', { documentElement: { dataset: {} }, startViewTransition: () => {} });
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		vi.stubGlobal('localStorage', { getItem: () => 'material', setItem: () => {} });
	};
	const loc = (pathname: string, index: number, search: SearchRecord = {}) => ({
		pathname,
		search,
		state: { __TSR_index: index },
	});

	it('does nothing outside a browser', () => {
		expect(
			createViewTransition(createSwapState(), {}).types({ fromLocation: loc('/a', 1), toLocation: loc('/b', 2) }),
		).toBe(false);
	});

	it('a declared screen param is another screen: the index pushes into a section', () => {
		phone();
		const vt = createViewTransition(createSwapState(), { screenParams: ['section'] });
		expect(
			vt.types({ fromLocation: loc('/settings', 1), toLocation: loc('/settings', 2, { section: 'theme' }) }),
		).toEqual(['push']);
	});

	it('an undeclared search param stays inside the page: no transition', () => {
		phone();
		const vt = createViewTransition(createSwapState(), {});
		expect(vt.types({ fromLocation: loc('/settings', 1), toLocation: loc('/settings', 2, { section: 'theme' }) })).toBe(
			false,
		);
	});

	it('the overlay option makes opening the sheet a push and closing it a back', () => {
		phone();
		const vt = createViewTransition(createSwapState(), { overlay: (search) => search.notifications === 1 });
		expect(
			vt.types({ fromLocation: loc('/pickups', 1), toLocation: loc('/pickups', 2, { notifications: 1 }) }),
		).toEqual(['push']);
		expect(
			vt.types({ fromLocation: loc('/pickups', 2, { notifications: 1 }), toLocation: loc('/pickups', 3) }),
		).toEqual(['back']);
	});

	it('a custom isTopLevel decides fade versus push (two-segment top-level pages)', () => {
		phone();
		const isTopLevel = ({ path }: { path: string }) => path.startsWith('/staff/');
		const vt = createViewTransition(createSwapState(), { isTopLevel });
		expect(vt.types({ fromLocation: loc('/staff/dashboard', 1), toLocation: loc('/staff/tenants', 2) })).toEqual([
			'fade',
		]);
	});

	it('sets the attributes the CSS reads for the transition that starts', () => {
		phone();
		const vt = createViewTransition(createSwapState(), {});
		vt.types({ fromLocation: loc('/pickups', 1), toLocation: loc('/forwarders', 2) });
		expect(document.documentElement.dataset).toMatchObject({ pageTransition: 'material', pageDirection: 'fade' });
	});
});

describe('the health of the early offer (the router internals contract)', () => {
	it('is untested until an offer was tried, then reports what it found', () => {
		const health = createHealth();
		expect(health.get()).toEqual({ earlyOffer: 'untested' });
		health.report('no-pending-component');
		expect(health.get()).toEqual({ earlyOffer: 'no-pending-component' });
		health.report('ok');
		expect(health.get()).toEqual({ earlyOffer: 'ok' });
		health.report('no-pending-component');
		expect(health.get()).toEqual({ earlyOffer: 'ok' });
	});

	it('a shape mismatch is sticky, carries its reason, and warns once in development', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const health = createHealth();
			health.report('shape-mismatch', 'boom');
			health.report('ok');
			health.report('shape-mismatch', 'again');
			expect(health.get()).toEqual({ earlyOffer: 'shape-mismatch', reason: 'again' });
			expect(warn).toHaveBeenCalledTimes(1);
		} finally {
			warn.mockRestore();
		}
	});

	const router = (over: { _tx?: object | undefined; stores?: object; routesById?: object }) => ({
		_tx: [0, 0, 0, [{ id: 'page', routeId: '/p', status: 'pending' }]],
		stores: { status: { get: () => 'pending' }, matches: { get: (): object[] => [] }, setMatches: () => {} },
		routesById: { '/p': { options: { pendingComponent: () => null } } },
		options: {},
		...over,
	});
	const read = (over: Parameters<typeof router>[0]) => {
		const seen: string[] = [];
		// SAFETY: a partial router double; `earlyOffer` reads only these members.
		// oxlint-disable-next-line house/no-never-any-casts -- a partial router fake
		const offer = earlyOffer(router(over) as never, (status, reason) =>
			seen.push(reason ? `${status}:${reason}` : status),
		);
		return { offer, seen };
	};

	it('reports ok when it builds an offer', () => {
		const { offer, seen } = read({});
		expect(offer?.matches.map((m) => m.status)).toEqual(['pending']);
		expect(seen).toEqual(['ok']);
	});

	it('reports no-pending-component when no route has a skeleton (legitimate, not a failure)', () => {
		expect(read({ routesById: {} }).seen).toEqual(['no-pending-component']);
	});

	it('reports a shape mismatch for a reordered transaction, and not for an idle router', () => {
		expect(read({ _tx: [0, 0, 0, 'nope'] }).seen[0]).toMatch(/^shape-mismatch:/);
		expect(read({ _tx: { 3: [] } }).seen[0]).toMatch(/^shape-mismatch:/);
		expect(read({ _tx: undefined }).seen).toEqual([]);
		expect(
			read({ stores: { status: { get: () => 'idle' }, matches: { get: () => [] }, setMatches: () => {} } }).seen,
		).toEqual([]);
	});
});
