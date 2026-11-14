import { expect, test } from '@playwright/test';

// Behaviour the screenshots cannot prove: computed styles of the real toasts on the catalog page.
test.beforeEach(async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/?page=toast');
	await page.locator('[data-sonner-toast][data-type="success"]').waitFor();
});

test('the action chip shows a visible focus ring (sonner resets its outline)', async ({ page }) => {
	const button = page.locator('[data-sonner-toast] [data-button]');
	// Keyboard modality first, so the programmatic focus matches :focus-visible.
	await page.keyboard.press('Tab');
	await button.focus();
	await expect(button).toBeFocused();
	const ring = await button.evaluate((el) => {
		const { outlineStyle, outlineWidth } = getComputedStyle(el);
		return { outlineStyle, outlineWidth };
	});
	expect(ring).toEqual({ outlineStyle: 'solid', outlineWidth: '2px' });
});

test('each type paints its own label and the app-supplied time', async ({ page }) => {
	const labels = {
		default: 'Notification',
		success: 'Done',
		error: 'Error',
		warning: 'Warning',
		info: 'Information',
		loading: 'In progress',
	};
	for (const [type, text] of Object.entries(labels)) {
		const selector =
			type === 'default' ? '[data-sonner-toast]:not([data-type])' : `[data-sonner-toast][data-type="${type}"]`;
		const content = page.locator(`${selector} [data-content]`);
		expect(await content.evaluate((el) => getComputedStyle(el, '::before').content)).toBe(`"${text}"`);
		expect(await content.evaluate((el) => getComputedStyle(el, '::after').content)).toBe('"now"');
	}
});

test('a plain toast has a spacer so its text lines up with the typed cards', async ({ page }) => {
	const left = (selector: string) =>
		page.locator(`${selector} [data-title]`).evaluate((el) => el.getBoundingClientRect().left);
	const plain = await left('[data-sonner-toast]:not([data-type])');
	const typed = await left('[data-sonner-toast][data-type="success"]');
	const card = (selector: string) => page.locator(selector).evaluate((el) => el.getBoundingClientRect().left);
	expect(plain - (await card('[data-sonner-toast]:not([data-type])'))).toBe(
		typed - (await card('[data-sonner-toast][data-type="success"]')),
	);
});

test('the card uses the toast radius token (20px) and the action chip the md radius', async ({ page }) => {
	const radius = (selector: string) =>
		page.locator(selector).evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
	expect(await radius('[data-sonner-toast][data-type="success"]')).toBe('20px');
	expect(await radius('[data-sonner-toast] [data-button]')).toBe('8px');
});
