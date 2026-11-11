// Tailwind cannot load inside Jest's sandbox: run it here (plain Node) and hand the CSS to the tests.
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');

module.exports = async () => {
	const { css } = await postcss([tailwind()]).process(readFileSync('global.css', 'utf8'), { from: 'global.css' });
	mkdirSync('node_modules/.cache', { recursive: true });
	writeFileSync('node_modules/.cache/tailwind-out.css', css);
};
