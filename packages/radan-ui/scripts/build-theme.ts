import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';

import { generateThemeCss } from '../src/theme/generate';

mkdirSync('dist', { recursive: true });
writeFileSync('dist/theme.css', generateThemeCss());
writeFileSync('dist/theme.native.css', generateThemeCss({ native: true }));
// The page transitions' animations: `@import '@radandevist/radan-ui/page-transition.css'` (no theme token needed).
copyFileSync('src/components/page-transition/page-transition.css', 'dist/page-transition.css');
