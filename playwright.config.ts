import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'catalog/tests',
	// Same baselines locally and on the CI Linux runner: one path, no per-OS suffix.
	snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
	// Tight on purpose: a one-letter label change moves more than that. If CI fonts differ, regenerate the baselines in CI
	// (`pnpm test:visual --update-snapshots`) rather than loosening this.
	expect: { toHaveScreenshot: { maxDiffPixels: 5 } },
	reporter: [['list'], ['html', { open: 'never' }]],
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'vite preview --config catalog/vite.config.ts',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
	},
});
