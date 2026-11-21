import { chromium } from '@playwright/test';
import { preview } from 'vite';

// What the QA scripts share about the demo app: serve the built catalog, and how to reach its router demo.
const PORT = 4174;

export const serveDemo = () =>
	preview({ root: new URL('..', import.meta.url).pathname, preview: { port: PORT, strictPort: true } });

export const demo = {
	baseUrl: `http://localhost:${PORT}/router-demo.html`,
	// CHROME_PATH: a Chromium that is already installed; unset = Playwright's own.
	launch: () => chromium.launch({ executablePath: process.env.CHROME_PATH }),
	login: async () => undefined, // the demo has no accounts
	delayedRequests: '**/router-demo-data.json*',
};
