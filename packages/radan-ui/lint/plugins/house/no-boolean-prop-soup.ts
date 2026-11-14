import type { Context, Visitor } from '@oxlint/plugins';
import type { ESTree } from '@oxlint/plugins';

/**
 * `house/no-boolean-prop-soup` — enforce docs/rules/composition.md: a component
 * composes its parts through `children`, it does not grow `hasX` / `showY`
 * boolean flags.
 *
 * Scope: `.tsx` files, PascalCase components (function declaration, arrow or
 * function expression, also wrapped in `memo` / `forwardRef`). The props type is
 * read from the first parameter's annotation, a `FC<P>` annotation or the
 * `forwardRef<El, P>` / `memo<P>` type arguments. A type literal is read as is;
 * a type reference is followed only to a same-file `type` / `interface`
 * (including `extends` and `&`). Anything imported or otherwise unresolvable
 * contributes nothing, so a component whose props live elsewhere is never reported.
 *
 * A "part toggle" is an optional-or-not `boolean` prop named `has|show|hide|with|
 * without|no|enable|disable|is` + Capital. `is*` / `has*` names are state, not a
 * toggle, when any camel-case word of the rest is a real state word (`isOpen`,
 * `isRemoveDialogOpen`, `isPending`, `hasNextPage`, …). Report when the
 * toggle count exceeds `max`. Option `layoutUnions` also reports a
 * `variant` / `layout` / `mode` prop that is a union of layout names.
 */

const TOGGLE_PREFIX = /^(has|show|hide|with|without|no|enable|disable|is)([A-Z].*)$/;
const DEFAULT_STATES = [
	'disabled',
	'open',
	'checked',
	'selected',
	'loading',
	'required',
	'readOnly',
	'active',
	'busy',
	'invalid',
	'expanded',
	'pressed',
	// async status and pagination words: `isPending`, `isCatalogError`, `hasNextPage`, `hasMore`.
	'pending',
	'error',
	'dirty',
	'fetching',
	'submitting',
	'saving',
	'success',
	'empty',
	'more',
	'next',
	'previous',
];
const LAYOUT_PROPS = new Set(['variant', 'layout', 'mode']);
const LAYOUT_NAMES = new Set(['card', 'row', 'tile', 'list', 'grid', 'compact', 'full']);
const WRAPPERS = new Set(['memo', 'forwardRef']);

type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;
type Ctx = { allowed: Set<string>; decls: Map<string, ESTree.Node> };
type RuleOptions = { max?: number; allow?: string[]; layoutUnions?: boolean };
type Members = { toggles: Set<string>; layoutUnions: Set<string> };

const calleeName = (callee: ESTree.Node): string | null => {
	if (callee.type === 'Identifier') {
		return callee.name;
	}
	if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
		return callee.property.name;
	}
	return null;
};

const propName = (key: ESTree.Node): string | null => {
	if (key.type === 'Identifier') {
		return key.name;
	}
	return key.type === 'Literal' ? String(key.value) : null;
};

const isBooleanType = (node: ESTree.Node): boolean => {
	if (node.type === 'TSBooleanKeyword') {
		return true;
	}
	if (node.type !== 'TSUnionType') {
		return false;
	}
	const rest = node.types.filter((part) => part.type !== 'TSUndefinedKeyword');
	return rest.length === 1 && rest[0] !== undefined && isBooleanType(rest[0]);
};

const unionLayoutCount = (node: ESTree.Node): number => {
	if (node.type !== 'TSUnionType') {
		return 0;
	}
	return node.types.filter(
		(part) =>
			part.type === 'TSLiteralType' && part.literal.type === 'Literal' && LAYOUT_NAMES.has(String(part.literal.value)),
	).length;
};

/** `is*` / `has*` describe state when any word of the rest is an allowed state word (`isRemoveDialogOpen`, `hasNextPage`). */
const isToggle = (name: string, allowed: Set<string>): boolean => {
	const match = TOGGLE_PREFIX.exec(name);
	if (!match) {
		return false;
	}
	if (match[1] !== 'is' && match[1] !== 'has') {
		return true;
	}
	const rest = match[2]!;
	const words = rest.match(/[A-Z][a-z0-9]*/g) ?? [];
	return ![rest, ...words].some((word) => allowed.has(word.toLowerCase()));
};

const readType = (node: ESTree.Node, ctx: Ctx, seen: Set<string>, out: Members): void => {
	switch (node.type) {
		case 'TSTypeLiteral': {
			for (const member of node.members) {
				readType(member, ctx, seen, out);
			}
			return;
		}
		case 'TSIntersectionType': {
			for (const part of node.types) {
				readType(part, ctx, seen, out);
			}
			return;
		}
		case 'TSTypeReference': {
			if (node.typeName.type !== 'Identifier' || seen.has(node.typeName.name)) {
				return;
			}
			seen.add(node.typeName.name);
			const decl = ctx.decls.get(node.typeName.name);
			if (decl) {
				readType(decl, ctx, seen, out);
			}
			return;
		}
		case 'TSTypeAliasDeclaration': {
			readType(node.typeAnnotation, ctx, seen, out);
			return;
		}
		case 'TSInterfaceDeclaration': {
			for (const heritage of node.extends) {
				if (heritage.expression.type === 'Identifier' && !seen.has(heritage.expression.name)) {
					seen.add(heritage.expression.name);
					const decl = ctx.decls.get(heritage.expression.name);
					if (decl) {
						readType(decl, ctx, seen, out);
					}
				}
			}
			for (const member of node.body.body) {
				readType(member, ctx, seen, out);
			}
			return;
		}
		case 'TSPropertySignature': {
			const name = propName(node.key);
			const type = node.typeAnnotation?.typeAnnotation;
			if (name === null || !type) {
				return;
			}
			if (isBooleanType(type) && isToggle(name, ctx.allowed)) {
				out.toggles.add(name);
			} else if (LAYOUT_PROPS.has(name) && unionLayoutCount(type) >= 2) {
				out.layoutUnions.add(name);
			}
			return;
		}
		default:
	}
};

const collectDecls = (body: ESTree.Node[], decls: Map<string, ESTree.Node>): void => {
	for (const statement of body) {
		const decl =
			(statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration') &&
			statement.declaration
				? statement.declaration
				: statement;
		if (decl.type === 'TSTypeAliasDeclaration' || decl.type === 'TSInterfaceDeclaration') {
			decls.set(decl.id.name, decl);
		}
	}
};

const typeArgsOf = (node: ESTree.Node): ESTree.Node[] => {
	// SAFETY: oxlint's ESTree typings name this field `typeArguments` on some versions and `typeParameters` on others.
	const withArgs = node as { typeArguments?: { params: ESTree.Node[] }; typeParameters?: { params: ESTree.Node[] } };
	return (withArgs.typeArguments ?? withArgs.typeParameters)?.params ?? [];
};

const typeParamNames = (fn: FunctionNode): string[] => {
	// SAFETY: oxc's TS-ESTree puts `typeParameters.params[].name` (an Identifier) on functions; the base typing omits it.
	const withParams = fn as { typeParameters?: { params: { name: { name: string } }[] } | null };
	return withParams.typeParameters?.params.map((param) => param.name.name) ?? [];
};

/** `FC<P>`, `React.FC<P>`, `FunctionComponent<P>`: the only annotations whose type argument is the props type. */
const COMPONENT_TYPES = new Set(['FC', 'FunctionComponent', 'VoidFunctionComponent']);
const isComponentAnnotation = (node: ESTree.Node | undefined): node is ESTree.TSTypeReference => {
	if (node?.type !== 'TSTypeReference') {
		return false;
	}
	const { typeName } = node;
	const last = typeName.type === 'TSQualifiedName' ? typeName.right : typeName;
	return last.type === 'Identifier' && COMPONENT_TYPES.has(last.name);
};

const paramType = (fn: FunctionNode): ESTree.Node | null => {
	const [first] = fn.params;
	if (!first || first.type === 'RestElement') {
		return null;
	}
	// SAFETY: a parameter pattern carries `typeAnnotation` in oxc's TS-ESTree; the base typing omits it.
	const annotated = first as { typeAnnotation?: { typeAnnotation: ESTree.Node } | null };
	return annotated.typeAnnotation?.typeAnnotation ?? null;
};

/** Peels `memo(...)` / `forwardRef(...)` / `as` wrappers; yields the function and any props type found on the way. */
const unwrapComponent = (init: ESTree.Node, propsFromWrappers: ESTree.Node[]): FunctionNode | null => {
	if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') {
		return init;
	}
	if (
		init.type === 'TSAsExpression' ||
		init.type === 'TSSatisfiesExpression' ||
		init.type === 'ParenthesizedExpression'
	) {
		return unwrapComponent(init.expression, propsFromWrappers);
	}
	if (init.type === 'CallExpression') {
		const name = calleeName(init.callee);
		const [first] = init.arguments;
		if (name === null || !WRAPPERS.has(name) || !first || first.type === 'SpreadElement') {
			return null;
		}
		const args = typeArgsOf(init);
		const props = name === 'forwardRef' ? args[1] : args[0];
		if (props) {
			propsFromWrappers.push(props);
		}
		return unwrapComponent(first, propsFromWrappers);
	}
	return null;
};

export const noBooleanPropSoup = {
	meta: {
		type: 'suggestion' as const,
		docs: {
			description:
				'Disallow components with several boolean part-toggle props (hasX, showY, …); compose the parts through children instead.',
			recommended: false,
		},
		schema: [
			{
				type: 'object',
				properties: {
					max: { type: 'integer', minimum: 0 },
					allow: { type: 'array', items: { type: 'string' } },
					layoutUnions: { type: 'boolean' },
				},
				additionalProperties: false,
			},
		],
		defaultOptions: [{ max: 1, allow: [], layoutUnions: false }],
		messages: {
			tooManyToggles:
				'`{{name}}` has {{count}} boolean part-toggle props ({{props}}): props must describe data, not which parts exist. Compose the parts through children / a compound component (docs/rules/composition.md).',
			layoutUnion:
				'`{{name}}` switches layouts with the `{{props}}` prop: several components are wearing one coat. Split it, or compose the shape through children (docs/rules/composition.md).',
		},
	},
	create(context: Context): Visitor {
		if (!context.filename.endsWith('.tsx')) {
			return {};
		}
		// SAFETY: the rule schema constrains the options to this shape.
		const config = (context.options?.[0] ?? {}) as RuleOptions;
		const max = config.max ?? 1;
		const layoutUnions = config.layoutUnions === true;
		const ctx: Ctx = {
			allowed: new Set([...DEFAULT_STATES, ...(config.allow ?? [])].map((word) => word.toLowerCase())),
			decls: new Map(),
		};

		// One walk per props type: a same-file `P` shared by many components is read once. Keyed by the resolved declaration.
		// A function's own type parameters shadow same-file types, so they pre-fill `seen` and skip the cache.
		const cache = new Map<ESTree.Node, Members>();
		const membersOf = (props: ESTree.Node, bound: string[]): Members => {
			const key =
				props.type === 'TSTypeReference' && props.typeName.type === 'Identifier'
					? (ctx.decls.get(props.typeName.name) ?? props)
					: props;
			let found = bound.length === 0 ? cache.get(key) : undefined;
			if (!found) {
				found = { toggles: new Set(), layoutUnions: new Set() };
				readType(props, ctx, new Set(bound), found);
				if (bound.length === 0) {
					cache.set(key, found);
				}
			}
			return found;
		};

		// `default` stands for an anonymous default export, which has no PascalCase name to test.
		const check = (name: string, props: ESTree.Node | null | undefined, at: ESTree.Node, fn?: FunctionNode | null) => {
			if (!props || (name !== 'default' && !/^[A-Z]/.test(name))) {
				return;
			}
			const found = membersOf(props, fn ? typeParamNames(fn) : []);
			if (found.toggles.size > max) {
				context.report({
					node: at,
					messageId: 'tooManyToggles',
					data: { name, count: String(found.toggles.size), props: [...found.toggles].join(', ') },
				});
			}
			if (layoutUnions && found.layoutUnions.size > 0) {
				context.report({
					node: at,
					messageId: 'layoutUnion',
					data: { name, props: [...found.layoutUnions].join(', ') },
				});
			}
		};

		const checkInit = (name: string, init: ESTree.Node, annotation: ESTree.Node | null, at: ESTree.Node) => {
			const wrapperProps: ESTree.Node[] = [];
			const fn = unwrapComponent(init, wrapperProps);
			// No inline function (`memo<P>(Existing)`, `const C: FC<P> = Existing`): the type arguments / annotation still count.
			check(name, (fn && paramType(fn)) ?? wrapperProps[0] ?? annotation, at, fn);
		};

		return {
			Program(program) {
				collectDecls(program.body, ctx.decls);
			},
			FunctionDeclaration(node) {
				if (node.id) {
					check(node.id.name, paramType(node), node.id, node);
				}
			},
			ExportDefaultDeclaration(node) {
				const { declaration } = node;
				if (declaration.type === 'FunctionDeclaration') {
					// A named one is already seen by `FunctionDeclaration`.
					if (!declaration.id) {
						check('default', paramType(declaration), node, declaration);
					}
					return;
				}
				if (declaration.type === 'TSInterfaceDeclaration' || declaration.type === 'ClassDeclaration') {
					return;
				}
				checkInit('default', declaration, null, node);
			},
			VariableDeclarator(node) {
				if (node.id.type !== 'Identifier' || !node.init) {
					return;
				}
				// `const X: FC<Props> = …` / `React.FC<Props>`
				const annotation = node.id.typeAnnotation?.typeAnnotation;
				const fcProps = isComponentAnnotation(annotation) ? typeArgsOf(annotation)[0] : undefined;
				checkInit(node.id.name, node.init, fcProps ?? null, node.id);
			},
		};
	},
};
