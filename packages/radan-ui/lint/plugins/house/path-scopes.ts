/**
 * Shared path helpers for lint rule file scoping.
 */
import { relative } from 'node:path';

const normalizeFilename = (filename: string): string => filename.replaceAll('\\', '/');

/** App source: `src/**`, or `apps/<name>/src/**` / `packages/<name>/src/**` when linting from a monorepo root, relative to the lint `cwd`; test files excluded. */
export const isSourceFile = (filename: string, cwd: string): boolean => {
	const normalized = normalizeFilename(relative(cwd, filename));
	return /^((apps|packages)\/[^/]+\/)?src\//.test(normalized) && !/\.test\.[jt]sx?$/.test(normalized);
};
