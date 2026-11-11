import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Pass `--base /radan-ui/` for the GitHub Pages build; the dev/preview default is `/`.
export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	plugins: [react(), tailwindcss()],
	build: { outDir: 'dist', emptyOutDir: true },
	preview: { port: 4173, strictPort: true },
});
