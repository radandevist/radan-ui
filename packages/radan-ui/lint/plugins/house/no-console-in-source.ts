import type { Context, Scope, Visitor } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

import { isSourceFile } from './path-scopes.ts';

/**
 * `house/no-console-in-source` - disallow `console.<method>(...)` calls in app source files.
 *
 * The rule is intentionally scoped to application/source package files and is
 * enabled in `.oxlintrc.json` at error level. It does not report test files,
 * scripts, server scripts, or obvious Node CLI entrypoints. It only reports:
 * the shared config cannot know a consumer's logger, so there is no autofix.
 */
const CONSOLE_METHODS: ReadonlySet<string> = new Set(['log', 'warn', 'error', 'info', 'debug', 'trace']);

const hasNodeShebang = (context: Context): boolean => context.sourceCode?.text?.startsWith('#!') === true;

/** A local `console` binding (import, parameter, variable) shadows the global one. */
const isConsoleShadowed = (scope: Scope | null): boolean => {
	for (let s = scope; s !== null && s.type !== 'global'; s = s.upper) {
		if (s.set.has('console')) {
			return true;
		}
	}
	return false;
};

const getConsoleMethod = (callee: ESTree.MemberExpression): string | null => {
	if (callee.computed) {
		return null;
	}

	// StaticMemberExpression — object and property are typed
	const obj = callee.object;
	if (obj.type !== 'Identifier' || obj.name !== 'console') {
		return null;
	}

	const prop = callee.property;
	if (prop.type !== 'Identifier') {
		return null;
	}

	const method = prop.name;
	if (CONSOLE_METHODS.has(method)) {
		return method;
	}
	return null;
};

export const noConsoleInSource = {
	meta: {
		type: 'problem' as const,
		docs: {
			description: 'Disallow console calls in app source files; use the app logger instead.',
			recommended: false,
		},
		schema: [],
		messages: {
			unexpected: 'Use the app logger instead of `console.{{method}}(...)` in source files.',
		},
	},
	create(context: Context): Visitor {
		if (!isSourceFile(context.filename, context.cwd) || hasNodeShebang(context)) {
			return {};
		}

		return {
			CallExpression(n) {
				const callee = n.callee;

				if (callee.type !== 'MemberExpression') {
					return;
				}

				const method = getConsoleMethod(callee);
				if (method === null) {
					return;
				}

				if (isConsoleShadowed(context.sourceCode.getScope(n))) {
					return;
				}

				context.report({
					node: n,
					messageId: 'unexpected',
					data: { method },
				});
			},
		};
	},
};
