import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from 'vitest';

const fonts = join(dirname(fileURLToPath(import.meta.url)), '../fonts');
const css = readFileSync(join(fonts, 'fonts.css'), 'utf8');

test('every url() in fonts.css is a file that ships, and the OFL text ships with them', () => {
	const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]!);
	expect(urls.length).toBeGreaterThan(0);
	expect(urls.filter((u) => !existsSync(join(fonts, u)))).toEqual([]);
	expect(existsSync(join(fonts, 'geist/OFL.txt'))).toBe(true);
});
