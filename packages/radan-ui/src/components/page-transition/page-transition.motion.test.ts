import { runInNewContext } from 'node:vm';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	appliedStyle,
	applyMotion,
	applyStoredMotion,
	installPageTransitions,
	MOTION_SCRIPT,
	writeStyle,
} from './page-transition.core';
import { STORAGE_KEY } from './page-transition.style';

afterEach(() => vi.unstubAllGlobals());

describe('applyMotion', () => {
	// Ported from shopkart-os apps/web/tests/motion-single-source.test.ts (`puts the applied style (auto resolved) on <html data-motion>`), verbatim.
	it('puts the applied style (auto resolved) on <html data-motion>', () => {
		const dataset: Record<string, string> = {};
		vi.stubGlobal('document', { documentElement: { dataset } });
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		applyMotion('none');
		expect(dataset.motion).toBe('none');
		applyMotion('auto', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' });
		expect(dataset.motion).toBe('material');
		applyMotion('auto', { userAgent: 'Mozilla/5.0 (X11; Linux)' });
		expect(dataset.motion).toBe('ios');
		writeStyle('material', { getItem: () => null, setItem: () => undefined });
		expect(dataset.motion).toBe('material');
		vi.stubGlobal('matchMedia', () => ({ matches: true }));
		applyMotion('material');
		expect(dataset.motion).toBe('none');
	});

	it('reads the stored style when none is given, and plays the style without matchMedia', () => {
		const dataset: Record<string, string> = {};
		vi.stubGlobal('document', { documentElement: { dataset } });
		vi.stubGlobal('localStorage', { getItem: () => 'material', setItem: () => {} });
		applyStoredMotion();
		expect(dataset.motion).toBe('material');
	});

	it('does nothing outside a browser', () => {
		expect(() => applyMotion('ios')).not.toThrow();
	});
});

describe('installPageTransitions follows the style', () => {
	it('re-applies on a storage event for its key and on the reduced-motion change', () => {
		const dataset: Record<string, string> = {};
		let stored = 'ios';
		let reduced = false;
		const media = new EventTarget();
		const window = Object.assign(new EventTarget(), { matchMedia: () => media });
		vi.stubGlobal('window', window);
		vi.stubGlobal('document', { documentElement: { dataset } });
		vi.stubGlobal('matchMedia', () => ({ matches: reduced }));
		vi.stubGlobal('localStorage', { getItem: () => stored, setItem: () => {} });
		installPageTransitions();
		expect(dataset.motion).toBe('ios');
		stored = 'material';
		window.dispatchEvent(Object.assign(new Event('storage'), { key: 'something-else' }));
		expect(dataset.motion).toBe('ios');
		window.dispatchEvent(Object.assign(new Event('storage'), { key: STORAGE_KEY }));
		expect(dataset.motion).toBe('material');
		reduced = true;
		media.dispatchEvent(new Event('change'));
		expect(dataset.motion).toBe('none');
	});
});

describe('MOTION_SCRIPT', () => {
	const run = (stored: string | null, userAgent: string, platform: string | undefined, reduced: boolean) => {
		const dataset: Record<string, string> = {};
		runInNewContext(MOTION_SCRIPT, {
			localStorage: { getItem: () => stored },
			navigator: { userAgent, userAgentData: platform === undefined ? undefined : { platform } },
			document: { documentElement: { dataset } },
			matchMedia: () => ({ matches: reduced }),
		});
		return dataset.motion;
	};
	const stored = [null, 'auto', 'ios', 'material', 'none', 'wobble'] as const;
	const agents: [string, string | undefined][] = [
		['Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126 Mobile', undefined],
		['Mozilla/5.0 (X11; Linux x86_64)', 'Android'],
		['Mozilla/5.0 (X11; Linux x86_64)', 'Linux'],
		['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', undefined],
		['', undefined],
	];

	it('is the same rule as appliedStyle over stored value x user agent x reduced motion', () => {
		for (const value of stored) {
			for (const [userAgent, platform] of agents) {
				for (const reduced of [false, true]) {
					const style = value === 'ios' || value === 'material' || value === 'none' ? value : 'auto';
					const expected = reduced
						? 'none'
						: appliedStyle(style, { userAgent, userAgentData: platform ? { platform } : undefined });
					expect(run(value, userAgent, platform, reduced), `${value} ${userAgent} ${platform} ${reduced}`).toBe(
						expected,
					);
				}
			}
		}
	});

	it('leaves the attribute unset when storage is blocked or matchMedia is missing', () => {
		const dataset: Record<string, string> = {};
		runInNewContext(MOTION_SCRIPT, {
			localStorage: {
				getItem: () => {
					throw new Error('blocked');
				},
			},
			document: { documentElement: { dataset } },
		});
		expect(dataset.motion).toBeUndefined();
	});
});
