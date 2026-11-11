// The package ships the repo-root docs, README and LICENSE: copy them in for `pack`/`publish`, remove them after.
// (`files` cannot point outside the package directory.) The copies are gitignored.
import { cpSync, rmSync } from 'node:fs';

const shipped = [
	['../../docs', 'docs'],
	['../../README.md', 'README.md'],
	['../../LICENSE', 'LICENSE'],
];

for (const [from, to] of shipped) {
	rmSync(to, { recursive: true, force: true });
	if (process.argv[2] !== 'clean') {
		cpSync(from, to, { recursive: true });
	}
}
