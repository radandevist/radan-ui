import { mkdirSync, writeFileSync } from 'node:fs';

import { generateThemeCss } from '../src/theme/generate';

mkdirSync('dist', { recursive: true });
writeFileSync('dist/theme.css', generateThemeCss());
