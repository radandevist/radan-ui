import { defineRule } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

const FORBIDDEN_SYMBOL_NAME = 'shape';

// Local customization: match whole words (camelCase, snake_case, kebab segments), so `reshape` or `Shaper` pass.
const WORD_BOUNDARY = /[_$-]+|(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/;

function containsForbiddenSymbolName(name: string): boolean {
	return name.split(WORD_BOUNDARY).some((word) => {
		const lower = word.toLowerCase();
		return lower === FORBIDDEN_SYMBOL_NAME || lower === `${FORBIDDEN_SYMBOL_NAME}s`;
	});
}

/** Ban the case-insensitive word "shape" in every JavaScript and TypeScript symbol name. */
export const noForbiddenTermInSymbolNamesRule = defineRule({
	meta: {
		type: 'problem',
		docs: {
			description:
				'Disallow the case-insensitive word "shape" in JavaScript, TypeScript, private, and JSX symbol names.',
		},
		messages: {
			forbiddenSymbolName:
				'Rename symbol "{{name}}" for its domain role; "shape" describes structure rather than ownership.',
		},
	},
	createOnce(context) {
		const reportForbiddenSymbolName = (node: ESTree.Node & { name: string }) => {
			if (!containsForbiddenSymbolName(node.name)) return;
			context.report({
				node,
				messageId: 'forbiddenSymbolName',
				data: { name: node.name },
			});
		};

		return {
			Identifier: reportForbiddenSymbolName,
			PrivateIdentifier: reportForbiddenSymbolName,
			JSXIdentifier: reportForbiddenSymbolName,
		};
	},
});
