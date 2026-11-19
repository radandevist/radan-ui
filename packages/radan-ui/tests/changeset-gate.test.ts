import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterAll, expect, test } from 'vitest';

/**
 * Replays the changeset gate's shell against a "Version packages" diff. That
 * automated PR (changesets/action) bumps `package.json`, writes `CHANGELOG.md`
 * and deletes the consumed changeset, so the gate must let it through while a
 * normal package change without a changeset still fails.
 */
const repo = mkdtempSync(join(tmpdir(), 'radan-ui-changeset-'));

const git = (args: string[]) => {
	const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
	if (result.status !== 0) {
		throw new Error(result.stderr);
	}
	return result.stdout.trim();
};

const write = (file: string, content: string) => {
	mkdirSync(dirname(join(repo, file)), { recursive: true });
	writeFileSync(join(repo, file), content);
};

const commit = (message: string) => {
	git(['add', '-A']);
	git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-m', message]);
};

write('packages/radan-ui/package.json', '{"name":"x","version":"0.0.0"}\n');
write('.changeset/initial-release.md', '---\n"x": minor\n---\n\nfirst\n');
write('README.md', 'readme\n');
git(['init', '-q']);
commit('base');
const base = git(['rev-parse', 'HEAD']);

write('packages/radan-ui/package.json', '{"name":"x","version":"0.1.0"}\n');
write('packages/radan-ui/CHANGELOG.md', '# x\n');
rmSync(join(repo, '.changeset/initial-release.md'));
commit('chore: version packages');

const workflow = readFileSync(join(process.cwd(), '../../.github/workflows/changeset-check.yml'), 'utf8');
const [, script] = workflow.split('- run: |\n');
if (script === undefined) {
	throw new Error('changeset gate script not found');
}

const gate = script
	.split('\n')
	.map((line) => line.replace(/^ {10}/, ''))
	.join('\n')
	.replace('${{ github.event.pull_request.base.sha }}', '$BASE_SHA');

const run = (headRef: string) =>
	spawnSync('bash', ['-c', gate], {
		cwd: repo,
		encoding: 'utf8',
		env: { ...process.env, BASE_SHA: base, HEAD_REF: headRef },
	});

test('the workflow passes the PR head ref to the gate script', () => {
	expect(workflow).toContain('HEAD_REF: ${{ github.event.pull_request.head.ref }}');
});

test('the automated version PR is exempt', () => {
	expect(run('changeset-release/main').status).toBe(0);
});

test('a package change without a changeset still fails', () => {
	const result = run('feature/change');
	expect(result.status).toBe(1);
	expect(result.stdout).toContain('add a changeset');
});

afterAll(() => rmSync(repo, { recursive: true, force: true }));
