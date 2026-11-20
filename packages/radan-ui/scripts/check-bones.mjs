// Tree-shaking guard (issue #66): a bone imported on its own must not pull a component (Card, Button, Base UI, sonner…).
// Walks the static imports of each bone entry in dist/ and fails if its closure holds anything of a component.
// Runs after the build, from `pnpm size`.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const bones = ['bone', 'bone-line', 'bone-pill', 'bone-text', 'bone-region'];
// What only a component carries: its surface classes, its libraries.
const forbidden = ['bg-card', 'rounded-control', 'rounded-input', 'rounded-toast', '@base-ui', 'sonner', 'size-11'];

const closure = (file, seen = new Set()) => {
	if (seen.has(file)) {
		return seen;
	}
	seen.add(file);
	const source = readFileSync(file, 'utf8');
	for (const [, spec] of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
		closure(resolve(dirname(file), spec), seen);
	}
	return seen;
};

const problems = [];
for (const platform of ['web', 'native']) {
	for (const name of bones) {
		const entry = join(dist, platform, `${name}.js`);
		if (!existsSync(entry)) {
			problems.push(`${platform}/${name}.js is missing`);
			continue;
		}
		for (const file of closure(entry)) {
			const source = readFileSync(file, 'utf8');
			for (const word of forbidden) {
				if (source.includes(word)) {
					problems.push(`${platform}/${name}.js pulls ${word} (via ${file.slice(dist.length + 1)})`);
				}
			}
		}
	}
}
// No root `Skeleton` anywhere: the barrel and the old subpath are gone.
if (/Skeleton/.test(readFileSync(join(dist, 'index.js'), 'utf8')) || existsSync(join(dist, 'web', 'skeleton.js'))) {
	problems.push('a root `Skeleton` export is still built');
}
if (problems.length > 0) {
	console.error(`Bone tree-shaking guard failed:\n- ${problems.join('\n- ')}`);
	process.exit(1);
}
console.log(`Bones tree-shake: ${bones.length} entries x 2 platforms import no component.`);
