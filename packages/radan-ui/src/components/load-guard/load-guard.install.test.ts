import { afterEach, describe, expect, it, vi } from 'vitest';

import { installLoadGuard, isLoadTimeout, isServerFnGet, LOAD_TIMEOUT, withLoadTimeout } from './load-guard.web';

describe('load-guard additions', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('isLoadTimeout recognises only our own error', () => {
		expect(isLoadTimeout(new Error(LOAD_TIMEOUT))).toBe(true);
		expect(isLoadTimeout(new Error('other'))).toBe(false);
		expect(isLoadTimeout('load_timeout')).toBe(false);
	});

	it('isServerFnGet: GET on /_serverFn/ only, a Request included', () => {
		expect(isServerFnGet('/_serverFn/a')).toBe(true);
		expect(isServerFnGet(new Request('http://x.test/_serverFn/a'))).toBe(true);
		expect(isServerFnGet('/_serverFn/a', { method: 'POST' })).toBe(false);
		expect(isServerFnGet('/api/a')).toBe(false);
	});

	it('the injected isLoaderCall decides: nothing matched, nothing bounded', async () => {
		const inner = vi.fn<typeof fetch>(() => Promise.resolve(new Response('ok')));
		await withLoadTimeout(inner, { isLoaderCall: () => false })('/_serverFn/a');
		expect(inner.mock.calls[0]?.[1]?.signal).toBeUndefined();
	});

	it('installLoadGuard wraps fetch once and its undo restores everything', () => {
		const original = vi.fn<typeof fetch>();
		const win = { fetch: original, addEventListener: vi.fn<() => void>(), removeEventListener: vi.fn<() => void>() };
		vi.stubGlobal('window', win);
		vi.stubGlobal('document', {
			visibilityState: 'visible',
			addEventListener: vi.fn<() => void>(),
			removeEventListener: vi.fn<() => void>(),
		});
		const router = { state: { status: 'idle', matches: [] }, invalidate: () => Promise.resolve() };
		const undo = installLoadGuard(router, { isLoaderCall: isServerFnGet });
		const wrapped = win.fetch;
		expect(wrapped).not.toBe(original);
		expect(installLoadGuard(router, { isLoaderCall: isServerFnGet })).toBe(undo);
		expect(win.fetch).toBe(wrapped);
		undo();
		expect(win.fetch).toBe(original);
		expect(win.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
	});
});
