import { relative } from "node:path";
// lint/plugins/house/arrow-function-components.ts
const isPascalCase = (name) => /^[A-Z]/.test(name);
const isHookLike = (name) => /^use[A-Z]/.test(name);
const WRAPPER_FNS = /* @__PURE__ */ new Set(["memo", "forwardRef"]);
const KNOWN_RENDERERS = /* @__PURE__ */ new Set([
	"useRender",
	"createElement",
	"jsx",
	"jsxs"
]);
const isJsxNode = (node) => node !== null && node !== void 0 && (node.type === "JSXElement" || node.type === "JSXFragment");
const expressionContainsJsx = (node) => {
	if (!node) return false;
	if (isJsxNode(node)) return true;
	if (node.type === "ParenthesizedExpression") return expressionContainsJsx(node.expression);
	if (node.type === "TSAsExpression" || node.type === "TSTypeAssertion" || node.type === "TSSatisfiesExpression" || node.type === "TSNonNullExpression") return expressionContainsJsx(node.expression);
	if (node.type === "ConditionalExpression") return expressionContainsJsx(node.consequent) || expressionContainsJsx(node.alternate);
	if (node.type === "LogicalExpression") return expressionContainsJsx(node.left) || expressionContainsJsx(node.right);
	return false;
};
const buildImportInfo = (programNode) => {
	const reactNamespaces = /* @__PURE__ */ new Set();
	const reactImportedNames = /* @__PURE__ */ new Set();
	const reactImportedNameToImported = /* @__PURE__ */ new Map();
	const importedNames = /* @__PURE__ */ new Set();
	const localFunctionDecls = /* @__PURE__ */ new Map();
	const localObjectMembers = /* @__PURE__ */ new Map();
	const registerLocalFn = (name, fnNode) => {
		if (name) localFunctionDecls.set(name, fnNode);
	};
	/**
	* Collect function-valued members of a top-level local object literal
	* (#1293). Only static `Identifier` keys mapping to functions are kept;
	* getters/setters and non-function members are ignored, and ANY spread
	* makes the whole object unresolvable (its shape is no longer local).
	*/
	const collectObjectMembers = (objExpr, into) => {
		let resolvable = true;
		for (const prop of objExpr.properties) {
			if (prop.type === "SpreadElement") {
				resolvable = false;
				break;
			}
			if (prop.type !== "Property" || prop.kind !== "init" || prop.key.type !== "Identifier") continue;
			const value = prop.value;
			if (value.type === "ArrowFunctionExpression" || value.type === "FunctionExpression" || value.type === "FunctionDeclaration") into.set(prop.key.name, value);
		}
		if (!resolvable) into.clear();
	};
	const collectVarDeclarators = (varDecl) => {
		for (const decl of varDecl.declarations) {
			const id = decl.id;
			const name = id.type === "Identifier" ? id.name : void 0;
			const init = decl.init;
			if (!name || !init) continue;
			if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") registerLocalFn(name, init);
			else if (init.type === "ObjectExpression") {
				let members = localObjectMembers.get(name);
				if (!members) {
					members = /* @__PURE__ */ new Map();
					localObjectMembers.set(name, members);
				}
				collectObjectMembers(init, members);
			}
		}
	};
	for (const node of programNode.body) if (node.type === "ImportDeclaration") {
		const isReact = node.source.value === "react";
		for (const specifier of node.specifiers) if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier") {
			const localName = specifier.local.name;
			if (localName) {
				importedNames.add(localName);
				if (isReact) reactNamespaces.add(localName);
			}
		} else if (specifier.type === "ImportSpecifier") {
			const localName = specifier.local.name;
			const importedName = specifier.imported.type === "Identifier" ? specifier.imported.name : specifier.imported.value;
			if (localName) {
				importedNames.add(localName);
				if (isReact && importedName) {
					reactImportedNameToImported.set(localName, importedName);
					if (WRAPPER_FNS.has(importedName)) reactImportedNames.add(localName);
				}
			}
		}
	} else {
		let fn = null;
		if (node.type === "FunctionDeclaration") fn = node;
		else if (node.type === "ExportDefaultDeclaration" && node.declaration.type === "FunctionDeclaration") fn = node.declaration;
		else if (node.type === "ExportNamedDeclaration") {
			const decl = node.declaration;
			if (decl && decl.type === "FunctionDeclaration") fn = decl;
			else if (decl && decl.type === "VariableDeclaration") collectVarDeclarators(decl);
		} else if (node.type === "VariableDeclaration") collectVarDeclarators(node);
		if (fn) {
			const id = fn.id;
			if (id) registerLocalFn(id.name, fn);
		}
	}
	return {
		reactNamespaces,
		reactImportedNames,
		reactImportedNameToImported,
		importedNames,
		localFunctionDecls,
		localObjectMembers
	};
};
const analyseBody = (body, importInfo, recursingFor = /* @__PURE__ */ new Set(), visiting = /* @__PURE__ */ new Set()) => {
	const result = {
		returnsJsx: false,
		returnsOnlyNullOrJsx: true,
		callsHook: false,
		returnsRendererCall: false
	};
	if (!body) return result;
	const localJsxVars = /* @__PURE__ */ new Set();
	const { reactNamespaces, reactImportedNameToImported, importedNames, localFunctionDecls } = importInfo;
	/**
	* Whether a CallExpression callee is a known renderer function
	* (useRender, createElement, jsx, jsxs) — bare identifier or React
	* namespace member expression.
	*/
	const isKnownRendererCallee = (callee) => {
		if (!callee) return false;
		if (callee.type === "Identifier" && KNOWN_RENDERERS.has(callee.name)) return true;
		if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && reactNamespaces.has(callee.object.name) && callee.property.type === "Identifier" && KNOWN_RENDERERS.has(callee.property.name)) return true;
		return false;
	};
	const isHookCallee = (callee) => {
		if (!callee) return false;
		if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && reactNamespaces.has(callee.object.name) && callee.property.type === "Identifier" && isHookLike(callee.property.name)) return true;
		if (callee.type === "Identifier") {
			const name = callee.name;
			if (reactImportedNameToImported.has(name)) {
				const importedName = reactImportedNameToImported.get(name);
				if (importedName && isHookLike(importedName)) return true;
			}
			if (!isHookLike(name)) return false;
			if (importedNames.has(name)) return true;
			if (localFunctionDecls.has(name)) {
				if (recursingFor.has(name)) return false;
				const fnBody = localFunctionDecls.get(name)?.body;
				if (!fnBody) return false;
				const next = new Set(recursingFor).add(name);
				if (fnBody.type === "BlockStatement") return analyseBody(fnBody, importInfo, next).callsHook;
				walkExprForHooks(fnBody);
				return result.callsHook;
			}
			return true;
		}
		return false;
	};
	const walkExprForHooks = (expr) => {
		if (!expr) return;
		if (expr.type === "CallExpression") {
			const callee = expr.callee;
			if (isHookCallee(callee)) result.callsHook = true;
			for (const arg of expr.arguments) if (arg.type !== "SpreadElement") walkExprForHooks(arg);
			if (callee.type === "MemberExpression") walkExprForHooks(callee.object);
		}
		if (expr.type === "MemberExpression") walkExprForHooks(expr.object);
	};
	const scanStatements = (statements) => {
		for (const stmt of statements) {
			if (!stmt) continue;
			if (stmt.type === "FunctionDeclaration") continue;
			if (stmt.type === "VariableDeclaration") {
				for (const decl of stmt.declarations) {
					walkExprForHooks(decl.init);
					if (decl.id.type === "Identifier" && decl.init && expressionContainsJsx(decl.init)) localJsxVars.add(decl.id.name);
				}
				continue;
			}
			if (stmt.type === "ExpressionStatement") {
				walkExprForHooks(stmt.expression);
				const expr = stmt.expression;
				if (expr.type === "AssignmentExpression" && expr.operator === "=" && expr.left.type === "Identifier" && expressionContainsJsx(expr.right)) localJsxVars.add(expr.left.name);
				continue;
			}
			if (stmt.type === "ReturnStatement") {
				const arg = stmt.argument;
				if (arg === null || arg === void 0) continue;
				if (expressionContainsJsx(arg)) result.returnsJsx = true;
				else if (arg.type === "CallExpression" && isKnownRendererCallee(arg.callee)) result.returnsRendererCall = true;
				else if (arg.type === "CallExpression" && arg.callee.type === "Identifier" && isLocalRenderDelegate(arg.callee.name, importInfo, visiting)) result.returnsRendererCall = true;
				else if (arg.type === "CallExpression" && arg.callee.type === "MemberExpression" && arg.callee.property.type === "Identifier" && isLocalMemberRenderDelegate(arg.callee.object, arg.callee.property, importInfo, visiting)) result.returnsRendererCall = true;
				else if (arg.type === "Identifier" && localJsxVars.has(arg.name)) result.returnsJsx = true;
				else if (!(arg.type === "Literal" && arg.value === null || arg.type === "Identifier" && arg.name === "undefined")) result.returnsOnlyNullOrJsx = false;
				continue;
			}
			if (stmt.type === "IfStatement") {
				walkExprForHooks(stmt.test);
				scanStatements([stmt.consequent]);
				if (stmt.alternate) scanStatements([stmt.alternate]);
				continue;
			}
			if (stmt.type === "BlockStatement") {
				scanStatements(stmt.body);
				continue;
			}
			if (stmt.type === "WhileStatement" || stmt.type === "DoWhileStatement") {
				walkExprForHooks(stmt.test);
				scanStatements([stmt.body]);
				continue;
			}
			if (stmt.type === "ForStatement") {
				walkExprForHooks(stmt.test);
				scanStatements([stmt.body]);
				continue;
			}
			if (stmt.type === "ForInStatement" || stmt.type === "ForOfStatement") {
				scanStatements([stmt.body]);
				continue;
			}
			if (stmt.type === "SwitchStatement") {
				walkExprForHooks(stmt.discriminant);
				for (const c of stmt.cases) scanStatements(c.consequent);
				continue;
			}
			if (stmt.type === "TryStatement") {
				scanStatements(stmt.block.body);
				const handler = stmt.handler;
				if (handler) scanStatements(handler.body.body);
				const finalizer = stmt.finalizer;
				if (finalizer) scanStatements(finalizer.body);
			}
		}
	};
	scanStatements(body.body);
	return result;
};
/**
* Whether a `return name(...)` call delegates rendering to a top-level LOCAL
* helper whose own body yields JSX — directly, through further such helpers,
* through local variables (#1293), or through a known renderer call (#1283).
* Imported callees are not resolved. `visiting` carries the resolution stack
* so mutually recursive helpers terminate.
*/
const isLocalRenderDelegate = (name, importInfo, visiting) => {
	const { importedNames, localFunctionDecls } = importInfo;
	if (importedNames.has(name)) return false;
	const localFn = localFunctionDecls.get(name);
	if (!localFn) return false;
	if (visiting.has(name)) return false;
	const fnBody = localFn.body;
	if (!fnBody) return false;
	const next = new Set(visiting).add(name);
	if (fnBody.type === "BlockStatement") {
		const nested = analyseBody(fnBody, importInfo, next, next);
		return nested.returnsJsx || nested.returnsRendererCall;
	}
	if (expressionContainsJsx(fnBody)) return true;
	if (fnBody.type === "CallExpression" && fnBody.callee.type === "Identifier") return isLocalRenderDelegate(fnBody.callee.name, importInfo, next);
	if (fnBody.type === "CallExpression" && fnBody.callee.type === "MemberExpression") return isLocalMemberRenderDelegate(fnBody.callee.object, fnBody.callee.property, importInfo, next);
	return false;
};
/**
* Whether a member-expression callee (`obj.member(...)`) resolves to a
* function-valued member of a top-level LOCAL object literal whose own body
* yields JSX (#1293). Only static `obj.prop` access on a locally declared
* object is resolved: imported namespaces and COMPUTED access (`obj[name]`)
* are not followed, and objects containing a spread were never collected.
* `visiting` carries the resolution stack so cyclic delegates terminate.
*/
const isLocalMemberRenderDelegate = (object, property, importInfo, visiting) => {
	if (object.type !== "Identifier") return false;
	if (property.type !== "Identifier") return false;
	const { importedNames, localObjectMembers } = importInfo;
	if (importedNames.has(object.name)) return false;
	const members = localObjectMembers.get(object.name);
	if (!members) return false;
	const key = `${object.name}.${property.name}`;
	const memberFn = members.get(property.name);
	if (!memberFn) return false;
	if (visiting.has(key)) return false;
	const fnBody = memberFn.body;
	if (!fnBody) return false;
	const next = new Set(visiting).add(key);
	if (fnBody.type === "BlockStatement") {
		const nested = analyseBody(fnBody, importInfo, /* @__PURE__ */ new Set(), next);
		return nested.returnsJsx || nested.returnsRendererCall;
	}
	if (expressionContainsJsx(fnBody)) return true;
	if (fnBody.type === "CallExpression" && fnBody.callee.type === "Identifier") return isLocalRenderDelegate(fnBody.callee.name, importInfo, next);
	if (fnBody.type === "CallExpression" && fnBody.callee.type === "MemberExpression") return isLocalMemberRenderDelegate(fnBody.callee.object, fnBody.callee.property, importInfo, next);
	return false;
};
const bodyLooksLikeComponent = (body, importInfo) => {
	const { returnsJsx, returnsOnlyNullOrJsx, callsHook, returnsRendererCall } = analyseBody(body, importInfo);
	if (returnsJsx) return true;
	if (returnsRendererCall) return true;
	if (callsHook && returnsOnlyNullOrJsx) return true;
	return false;
};
const isWrapperCall = (node, importInfo) => {
	if (!node || node.type !== "CallExpression") return false;
	const { reactNamespaces, reactImportedNames } = importInfo;
	const callee = node.callee;
	if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && reactNamespaces.has(callee.object.name) && callee.property.type === "Identifier") return WRAPPER_FNS.has(callee.property.name);
	if (callee.type === "Identifier") return reactImportedNames.has(callee.name);
	return false;
};
/** Empty program used as a fallback when the Program visitor hasn't fired yet. */
const EMPTY_PROGRAM = {
	type: "Program",
	body: [],
	sourceType: "module",
	comments: [],
	tokens: [],
	parent: null,
	range: [0, 0],
	start: 0,
	end: 0,
	loc: {
		start: {
			line: 1,
			column: 0
		},
		end: {
			line: 1,
			column: 0
		}
	}
};
const arrowFunctionComponents = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require React components to be defined as arrow functions, not function declarations.",
			recommended: false
		},
		schema: [],
		messages: {
			useArrowFunction: "React components must be defined as arrow function expressions (const {{name}} = () => ...), not function declarations.",
			useArrowFunctionAnonymous: "React components must be defined as arrow function expressions, not anonymous function declarations."
		}
	},
	create(context) {
		let importInfo = null;
		return {
			Program(node) {
				importInfo = buildImportInfo(node);
			},
			FunctionDeclaration(node) {
				if (node.generator) return;
				const info = importInfo ?? buildImportInfo(EMPTY_PROGRAM);
				const name = node.id?.name;
				const parent = node.parent;
				if (!node.id && parent?.type === "ExportDefaultDeclaration") {
					if (!bodyLooksLikeComponent(node.body, info)) return;
					context.report({
						node,
						messageId: "useArrowFunctionAnonymous",
						data: { name: "default" }
					});
					return;
				}
				if (!name || !isPascalCase(name)) return;
				if (!bodyLooksLikeComponent(node.body, info)) return;
				context.report({
					node,
					messageId: "useArrowFunction",
					data: { name }
				});
			},
			FunctionExpression(node) {
				if (node.generator) return;
				const parent = node.parent;
				if (!parent) return;
				const info = importInfo ?? buildImportInfo(EMPTY_PROGRAM);
				if (parent.type === "CallExpression" && isWrapperCall(parent, info) && parent.arguments[0] === node) {
					if (!bodyLooksLikeComponent(node.body, info)) return;
					const name = node.id?.name ?? "Component";
					context.report({
						node,
						messageId: "useArrowFunction",
						data: { name }
					});
				}
			}
		};
	}
};
// lint/plugins/house/no-array-reduce.ts
/**
* `house/no-array-reduce` — disallow `Array.prototype.reduce` and
* `Array.prototype.reduceRight` calls.
*
* Rationale (docs/guides/code-quality.md → "House lint rules"):
*   "No `Array.reduce()` — use `find`, `filter+map`, `for...of`, or
*    `Object.groupBy`."
*
* Rule shape (oxlint 1.79.0): `{ meta, create(context) }` returning an AST
* visitor. See https://oxc.rs/docs/guide/usage/linter/js-plugins.html
*/
const FORBIDDEN_METHODS = /* @__PURE__ */ new Set(["reduce", "reduceRight"]);
/**
* Resolves the statically-known method name from a MemberExpression callee,
* or returns `null` when the name cannot be determined.
*/
const resolveMethodName = (callee) => {
	if (!callee.computed) {
		const prop = callee.property;
		if (prop.type === "Identifier") return prop.name;
		return null;
	}
	const prop = callee.property;
	if (prop.type === "Literal" && (prop.value === "reduce" || prop.value === "reduceRight")) return prop.value;
	return null;
};
const noArrayReduce = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow Array.prototype.reduce/reduceRight; use find, filter+map, for...of, or Object.groupBy instead.",
			recommended: false
		},
		schema: [],
		messages: { noReduce: "Do not use `.{{method}}()`. Prefer `find`, `filter+map`, `for...of`, or `Object.groupBy` instead (docs/guides/code-quality.md → \"No Array.reduce()\")." }
	},
	create(context) {
		return { CallExpression(node) {
			const { callee } = node;
			if (callee.type !== "MemberExpression") return;
			const methodName = resolveMethodName(callee);
			if (methodName === null || !FORBIDDEN_METHODS.has(methodName)) return;
			context.report({
				node,
				messageId: "noReduce",
				data: { method: methodName }
			});
		} };
	}
};
// lint/plugins/house/path-scopes.ts
/**
* Shared path helpers for lint rule file scoping.
*/
const normalizeFilename = (filename) => filename.replaceAll("\\", "/");
/** App source: `src/**` relative to the lint `cwd`, test files excluded. */
const isSourceFile = (filename, cwd) => {
	const normalized = normalizeFilename(relative(cwd, filename));
	return normalized.startsWith("src/") && !/\.test\.[jt]sx?$/.test(normalized);
};
// lint/plugins/house/no-console-in-source.ts
/**
* `house/no-console-in-source` - disallow `console.<method>(...)` calls in app source files.
*
* The rule is intentionally scoped to application/source package files and is
* enabled in `.oxlintrc.json` at error level. It does not report test files,
* scripts, server scripts, or obvious Node CLI entrypoints. It only reports:
* the shared config cannot know a consumer's logger, so there is no autofix.
*/
const CONSOLE_METHODS = /* @__PURE__ */ new Set([
	"log",
	"warn",
	"error",
	"info",
	"debug",
	"trace"
]);
const hasNodeShebang = (context) => context.sourceCode?.text?.startsWith("#!") === true;
/** A local `console` binding (import, parameter, variable) shadows the global one. */
const isConsoleShadowed = (scope) => {
	for (let s = scope; s !== null && s.type !== "global"; s = s.upper) if (s.set.has("console")) return true;
	return false;
};
const getConsoleMethod = (callee) => {
	if (callee.computed) return null;
	const obj = callee.object;
	if (obj.type !== "Identifier" || obj.name !== "console") return null;
	const prop = callee.property;
	if (prop.type !== "Identifier") return null;
	const method = prop.name;
	if (CONSOLE_METHODS.has(method)) return method;
	return null;
};
const noConsoleInSource = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow console calls in app source files; use the app logger instead.",
			recommended: false
		},
		schema: [],
		messages: { unexpected: "Use the app logger instead of `console.{{method}}(...)` in source files." }
	},
	create(context) {
		if (!isSourceFile(context.filename, context.cwd) || hasNodeShebang(context)) return {};
		return { CallExpression(n) {
			const callee = n.callee;
			if (callee.type !== "MemberExpression") return;
			const method = getConsoleMethod(callee);
			if (method === null) return;
			if (isConsoleShadowed(context.sourceCode.getScope(n))) return;
			context.report({
				node: n,
				messageId: "unexpected",
				data: { method }
			});
		} };
	}
};
// lint/plugins/house/no-iife.ts
/**
* `house/no-iife` — disallow immediately invoked function expressions
* (IIFEs).
*
* Rationale (issue #1303): an IIFE hides imperative branching inside an
* expression. Extract a named function, or compute the value with preceding
* statements instead.
*
* Detection: a `CallExpression`/`NewExpression` whose callee is a function
* literal (`ArrowFunctionExpression` | `FunctionExpression`), ignoring
* transparent wrappers around the callee — `ParenthesizedExpression`,
* `TSAsExpression`, `TSSatisfiesExpression`, `TSNonNullExpression`,
* `TSTypeAssertion`, and `TSInstantiationExpression`. The comma-operator form
* `(0, fn)()` (`SequenceExpression` callee, last expression taken) is peeled
* too, so `(0, () => {})()` is reported. Branching callees are peeled into
* every reachable branch (#1327): `(cond ? () => 1 : () => 2)()`,
* `(cond && (() => 3))()`, and `(a ?? (() => 4))()` are reported when ANY
* branch is a function literal. A function literal used as a tagged-
* template tag (`(() => x)`t`)`) is an immediate invocation as well and is
* reported via `TaggedTemplateExpression`.
*/
/**
* Peels transparent syntactic wrappers off a callee expression and returns
* every UNDERLYING candidate expression reached.
*
* - Transparent wrappers (`ParenthesizedExpression`, TS casts/non-null,
*   `TSInstantiationExpression`) yield exactly one candidate: their child.
* - The comma-operator callee `(0, fn)()` (`SequenceExpression`) yields one
*   candidate: the LAST expression in the sequence.
* - Branching forms are peeled structurally, without heuristics:
*   `ConditionalExpression` yields the peeled `consequent` AND `alternate`
*   (the `test` is never a callee and is ignored); `LogicalExpression`
*   yields the peeled `left` AND `right`. A callee is an immediate
*   invocation when ANY candidate is a function literal.
*/
const unwrapCallee = (node) => {
	let current = node;
	for (;;) switch (current.type) {
		case "ParenthesizedExpression":
		case "TSAsExpression":
		case "TSSatisfiesExpression":
		case "TSNonNullExpression":
		case "TSTypeAssertion":
			current = current.expression;
			continue;
		case "TSInstantiationExpression":
			current = current.expression;
			continue;
		case "SequenceExpression": {
			const { expressions } = current;
			current = expressions[expressions.length - 1];
			continue;
		}
		case "ConditionalExpression": {
			const { consequent, alternate } = current;
			return [...unwrapCallee(consequent), ...unwrapCallee(alternate)];
		}
		case "LogicalExpression": {
			const { left, right } = current;
			return [...unwrapCallee(left), ...unwrapCallee(right)];
		}
		default: return [current];
	}
};
const isFunctionLiteral = (node) => node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression";
/**
* True when the callee is (behind transparent wrappers or across
* conditional/logical branches) an inline function literal being invoked
* immediately.
*/
const isIifeCallee = (callee) => unwrapCallee(callee).some(isFunctionLiteral);
const noIife = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Disallow immediately invoked function expressions (IIFEs); extract a named function or compute the value with preceding statements instead.",
			recommended: false
		},
		schema: [],
		messages: { noIife: "Avoid immediately invoked function expressions (IIFEs); extract a named function or compute the value with preceding statements." }
	},
	create(context) {
		const reportIfIife = (callee, node) => {
			if (!isIifeCallee(callee)) return;
			context.report({
				node,
				messageId: "noIife"
			});
		};
		return {
			CallExpression(node) {
				reportIfIife(node.callee, node);
			},
			NewExpression(node) {
				reportIfIife(node.callee, node);
			},
			TaggedTemplateExpression(node) {
				reportIfIife(node.tag, node);
			}
		};
	}
};
// lint/plugins/house/no-never-any-casts.ts
/**
* `house/no-never-any-casts` — disallow single type assertions to `never`
* or `any` (`x as never`, `x as any`, `<never>x`, `<any>x`) and the same
* keyword annotations under the `satisfies` operator (`x satisfies never`,
* `x satisfies any`).
*
* Rationale (issue #1337, part of the #1160 anti-slop ladder): two single,
* non-chained `as never` casts slipped past anti-slop rungs 4+5 because
* those rungs cover only CHAINED assertions. A single assertion to `never`
* or `any` discards all type evidence exactly like a chain does — the real
* shape should be constructed or narrowed instead.
*
* Since #1346 the `satisfies` operator is covered too (`TSSatisfiesExpression`):
* used to satisfy a bare `never`/`any`, it discards type evidence exactly
* like an assertion and previously evaded the keyword ban entirely.
*
* Candidate rule status (#1337): shipped DORMANT (`"off"` in
* `.oxlintrc.json`) — one rule per PR at error, so this PR fixes the two
* known sites and records the measured baseline only; enabling it at
* `error` is a separate follow-up PR. Measured counts per package live in
* `docs/guides/lint-rules.md`.
*
* Scope notes:
* - Only ASSERTION/SATISFIES annotations are inspected (`TSAsExpression` /
*   `TSTypeAssertion` / `TSSatisfiesExpression`, parenthesized type peeled).
*   Type annotations, union members, and generic type arguments carrying
*   `never`/`any` are out of scope — this rule targets evidence-discarding
*   casts, not every mention of the keywords (`typescript/no-explicit-any`
*   already governs explicit `any` annotations).
* - The ban is SYNTACTIC on the keyword nodes (`TSAnyKeyword` /
*   `TSNeverKeyword`): an alias whose definition mentions `never`
*   (`type N = never; x satisfies N`) is NOT resolved — that would need
*   type information this rule deliberately avoids.
* - Assertion CHAINS (`x as any as never`) are already reported by
*   `anti-slop/no-chained-type-assertions` (rung 5); each link in such a
*   chain that lands on `never`/`any` is still reported here, so an enabled
*   future overlaps with rung 5 on chains by design (the keyword ban is
*   independent of chain depth). Mixed chains mixing operators
*   (`x as any satisfies never`) report each keyword link once too.
*/
/** Peels parenthesized type wrappers off an assertion annotation. */
const unwrapAnnotationType = (type) => {
	let current = type;
	while (current.type === "TSParenthesizedType") current = current.typeAnnotation;
	return current;
};
const resolveForbiddenKeyword = (type) => {
	const unwrapped = unwrapAnnotationType(type);
	if (unwrapped.type === "TSAnyKeyword") return "any";
	if (unwrapped.type === "TSNeverKeyword") return "never";
	return null;
};
const noNeverAnyCasts = {
	meta: {
		type: "problem",
		docs: {
			description: "Disallow single type assertions to never or any; construct or narrow the real shape instead.",
			recommended: false
		},
		schema: [],
		messages: { noNeverAnyCast: "Do not assert to `{{keyword}}` — the cast discards all type evidence. Construct the real shape, parse untrusted input at its boundary, or make the plumbing genuinely shape-agnostic (`unknown`)." }
	},
	create(context) {
		const checkAnnotation = (node) => {
			const keyword = resolveForbiddenKeyword(node.typeAnnotation);
			if (keyword === null) return;
			context.report({
				node,
				messageId: "noNeverAnyCast",
				data: { keyword }
			});
		};
		return {
			TSAsExpression: checkAnnotation,
			TSSatisfiesExpression: checkAnnotation,
			TSTypeAssertion: checkAnnotation
		};
	}
};
// lint/plugins/house/prefer-early-return.ts
const isConditionalExpression = (node) => node !== null && node !== void 0 && node.type === "ConditionalExpression";
const isIdentifier = (node, name) => node !== null && node !== void 0 && node.type === "Identifier" && node.name === name;
// lint/plugins/house/index.ts
/**
* House rules: the coding style shared by Radan's apps (the generic half of ShopKartOS's rules).
*
* A plain plugin object, not `eslintCompatPlugin(...)`: every rule below uses
* `create`, and `eslintCompatPlugin` only converts `createOnce` rules. Dropping
* it keeps `@oxlint/plugins` a type-only import, so the published plugin has no
* runtime dependency (consumers install none).
*/
var house_default = {
	meta: { name: "house" },
	rules: {
		"arrow-function-components": arrowFunctionComponents,
		"no-array-reduce": noArrayReduce,
		"no-console-in-source": noConsoleInSource,
		"no-iife": noIife,
		"no-never-any-casts": noNeverAnyCasts,
		"prefer-early-return": {
			meta: {
				type: "problem",
				docs: {
					description: "Prefer an explicit `if` + early `return` over a ternary expression whose value is returned directly via a `return` statement, or assigned to a variable that is immediately returned.",
					recommended: false
				},
				schema: [],
				messages: { preferEarlyReturn: "Prefer an explicit `if` + early `return` over this ternary expression. This ternary is returned directly (or assigned then returned) — replace it with a guard clause for readability (see #1666)." }
			},
			create(context) {
				const isSingleLineTernary = (node) => node.loc.start.line === node.loc.end.line;
				const reportIfMultiLine = (node) => {
					if (!isSingleLineTernary(node)) context.report({
						loc: {
							start: {
								line: node.loc.start.line,
								column: node.loc.start.column
							},
							end: {
								line: node.loc.end.line,
								column: node.loc.end.column
							}
						},
						messageId: "preferEarlyReturn"
					});
				};
				const checkBodyStatements = (statements) => {
					for (let index = 0; index < statements.length; index += 1) {
						const stmt = statements[index];
						if (stmt.type === "VariableDeclaration") {
							const declaration = stmt.declarations[0];
							if (declaration && declaration.id.type === "Identifier" && isConditionalExpression(declaration.init)) {
								const varName = declaration.id.name;
								const nextStmt = statements[index + 1];
								if (nextStmt && nextStmt.type === "ReturnStatement" && isIdentifier(nextStmt.argument, varName)) reportIfMultiLine(declaration.init);
							}
						}
					}
				};
				return {
					ReturnStatement(node) {
						if (isConditionalExpression(node.argument)) reportIfMultiLine(node.argument);
					},
					BlockStatement(node) {
						checkBodyStatements(node.body);
					},
					SwitchCase(node) {
						checkBodyStatements(node.consequent);
					}
				};
			}
		}
	}
};
export { house_default as default };
