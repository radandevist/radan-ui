import { readdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';

// One screenshot per catalog page (apps/catalog/pages/<name>.page.tsx), found on disk: adding a page adds its tests.
// Baselines: tests/__screenshots__/<page>-<theme>-<viewport>.png, rendered by CI (see CONTRIBUTING.md, "Visual changes").
const pages = readdirSync(new URL('../pages', import.meta.url))
	.filter((file) => file.endsWith('.page.tsx'))
	.map((file) => file.replace('.page.tsx', ''))
	.sort();

const viewports = [
	{ name: 'phone', width: 390, height: 844 },
	{ name: 'desktop', width: 1440, height: 900 },
];

for (const page of pages) {
	for (const theme of ['light', 'dark']) {
		for (const { name, width, height } of viewports) {
			test(`${page} page, ${theme}, ${name}`, async ({ page: tab }) => {
				await tab.setViewportSize({ width, height });
				await tab.goto(`/?page=${page}&theme=${theme}`);
				await tab.evaluate(() => document.fonts.ready);
				await expect(tab).toHaveScreenshot(`${page}-${theme}-${name}.png`, { fullPage: true });
			});
		}
	}
}
