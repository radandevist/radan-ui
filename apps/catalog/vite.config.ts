import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Pass `--base /radan-ui/` for the GitHub Pages build; the dev/preview default is `/`.
export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	plugins: [react(), tailwindcss()],
	// Two pages: the catalog and the real-router demo that nav-stress and the transition walk run against (spec §9.4).
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: { input: { main: 'index.html', 'router-demo': 'router-demo.html' } },
	},
	preview: { port: 4173, strictPort: true },
});
