import { expect, test } from '@playwright/test';

const viewports = [
	{ name: 'phone', width: 390, height: 844 },
	{ name: 'desktop', width: 1440, height: 900 },
];

for (const theme of ['light', 'dark']) {
	for (const { name, width, height } of viewports) {
		test(`tokens page, ${theme}, ${name}`, async ({ page }) => {
			await page.setViewportSize({ width, height });
			await page.goto(`/?theme=${theme}`);
			await page.evaluate(() => document.fonts.ready);
			await expect(page).toHaveScreenshot(`tokens-${theme}-${name}.png`, { fullPage: true });
		});
	}
}
