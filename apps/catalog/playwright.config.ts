import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	// Same baselines locally and on the CI Linux runner: one path, no per-OS suffix.
	snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
	// Tight on purpose: a one-letter label change moves more than that. Baselines are rendered with the CI runner's
	// fonts: to regenerate them, run the "Visual baselines" workflow and commit the artifact into apps/catalog/tests/__screenshots__/.
	expect: { toHaveScreenshot: { maxDiffPixels: 5 } },
	reporter: [['list'], ['html', { open: 'never' }]],
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: 'vite preview --config vite.config.ts',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
	},
});
