import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'catalog/tests',
	// Same baselines locally and on the CI Linux runner: one path, no per-OS suffix.
	snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
	// Tolerates sub-pixel font rasterisation differences between machines; real token changes move far more pixels.
	expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
	reporter: [['list'], ['html', { open: 'never' }]],
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'vite preview --config catalog/vite.config.ts',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
	},
});
