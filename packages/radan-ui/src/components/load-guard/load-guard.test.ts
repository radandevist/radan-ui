import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	FETCH_LIMIT_MS,
	isServerFnGet,
	NO_LOAD_TIMEOUT,
	PENDING_LIMIT_MS,
	watchLoad,
	withLoadTimeout,
} from './load-guard.web';

describe('the load guard (#318)', () => {
	type Router = Parameters<typeof watchLoad>[0];
	const fakeRouter = (status: string, matches: string[]) => {
		const invalidate = vi.fn<() => Promise<void>>(() => Promise.resolve());
		const state = { status, matches: matches.map((m) => ({ status: m })) };
		const router: Router = { state, invalidate };
		return {
			router,
			invalidate,
			set: (s: string, m: string[]) => Object.assign(state, { status: s, matches: m.map((x) => ({ status: x })) }),
		};
	};
	const listeners = new Map<string, () => void>();
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal('window', {
			addEventListener: (n: string, f: () => void) => listeners.set(n, f),
			removeEventListener: () => {},
		});
		vi.stubGlobal('document', {
			visibilityState: 'visible',
			addEventListener: (n: string, f: () => void) => listeners.set(n, f),
			removeEventListener: () => {},
		});
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		listeners.clear();
	});

	it('reloads once a router idle with a page still pending (the stuck skeleton)', () => {
		const { router, invalidate } = fakeRouter('idle', ['success', 'pending']);
		watchLoad(router);
		vi.advanceTimersByTime(10_000);
		expect(invalidate).toHaveBeenCalledTimes(1);
	});

	it('leaves a healthy router alone', () => {
		const { router, invalidate } = fakeRouter('idle', ['success', 'success']);
		watchLoad(router);
		vi.advanceTimersByTime(60_000);
		expect(invalidate).not.toHaveBeenCalled();
	});

	it('reloads a load still pending after the limit, once, not before', () => {
		const { router, invalidate } = fakeRouter('pending', ['success', 'pending']);
		watchLoad(router);
		vi.advanceTimersByTime(PENDING_LIMIT_MS - 4_000);
		expect(invalidate).not.toHaveBeenCalled();
		vi.advanceTimersByTime(60_000);
		expect(invalidate).toHaveBeenCalledTimes(1);
	});

	it('checks again when the tab comes back and when the network returns', () => {
		const { router, invalidate, set } = fakeRouter('idle', ['success', 'success']);
		watchLoad(router);
		set('idle', ['success', 'pending']);
		listeners.get('online')?.();
		expect(invalidate).toHaveBeenCalledTimes(1);
		set('idle', ['success', 'success']);
		listeners.get('visibilitychange')?.();
		set('idle', ['success', 'pending']);
		listeners.get('visibilitychange')?.();
		expect(invalidate).toHaveBeenCalledTimes(2);
	});

	it('does not check while the tab is hidden', () => {
		const { router, invalidate } = fakeRouter('idle', ['success', 'pending']);
		watchLoad(router);
		vi.stubGlobal('document', { visibilityState: 'hidden', addEventListener: () => {}, removeEventListener: () => {} });
		listeners.get('visibilitychange')?.();
		expect(invalidate).not.toHaveBeenCalled();
	});

	describe('withLoadTimeout', () => {
		const loader = { isLoaderCall: isServerFnGet };
		const hang: typeof fetch = (_input, init) =>
			new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)));

		it('fails a hung loader call with load_timeout after the limit', async () => {
			const outcome = withLoadTimeout(hang, loader)('/_serverFn/abc?payload=1').catch((cause: unknown) => cause);
			await vi.advanceTimersByTimeAsync(FETCH_LIMIT_MS + 1);
			expect(await outcome).toEqual(new Error('load_timeout'));
		});

		it('works where AbortSignal.any does not exist (Safari < 17.4, old WebViews)', async () => {
			vi.stubGlobal('AbortSignal', { ...AbortSignal, any: undefined });
			const ok = await withLoadTimeout(() => Promise.resolve(new Response('ok')), loader)('/_serverFn/abc');
			expect(await ok.text()).toBe('ok');
			const outcome = withLoadTimeout(hang, loader)('/_serverFn/abc').catch((cause: unknown) => cause);
			await vi.advanceTimersByTimeAsync(FETCH_LIMIT_MS + 1);
			expect(await outcome).toEqual(new Error('load_timeout'));
		});

		it('leaves an action that opts out (the CSV export, a GET) without a limit', async () => {
			const outcome = withLoadTimeout(hang, loader)('/_serverFn/abc', { headers: { [NO_LOAD_TIMEOUT]: '1' } });
			let settled = false;
			void outcome.catch(() => (settled = true));
			await vi.advanceTimersByTimeAsync(FETCH_LIMIT_MS * 3);
			expect(settled).toBe(false);
		});

		it('leaves a mutation (POST) and any other request without a limit', async () => {
			const inner = vi.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>(
				(..._args: Parameters<typeof fetch>) => Promise.resolve(new Response('ok')),
			);
			await withLoadTimeout(inner, loader)('/_serverFn/abc', { method: 'POST' });
			await withLoadTimeout(inner, loader)('/api/version');
			expect(inner.mock.calls.every(([, init]) => init?.signal === undefined)).toBe(true);
		});

		it('keeps the caller’s own abort error (a superseded navigation)', async () => {
			const controller = new AbortController();
			const outcome = withLoadTimeout(hang, loader)('/_serverFn/abc', { signal: controller.signal }).catch(
				(cause: unknown) => cause,
			);
			controller.abort();
			expect(await outcome).toMatchObject({ name: 'AbortError' });
		});
	});
});
