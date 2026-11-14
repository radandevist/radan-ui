/**
 * Spec for `house/no-boolean-prop-soup` (docs/rules/composition.md).
 *
 * Uses Oxlint's own `RuleTester` (from `oxlint/plugins-dev`) bridged into vitest,
 * matching the house pattern in `no-iife.test.ts`.
 *
 * What this proves:
 * - `invalid`: more than `max` (default 1) part-toggle booleans, on an inline
 *   type, a same-file alias / interface, `extends`, an intersection, arrow /
 *   function / `memo` / `forwardRef` / `FC<P>` components, plus the `max` and
 *   `layoutUnions` options.
 * - `valid`: real-state allowlist (and `isOpen`-style names), `allow` option,
 *   imported / external props types, lowercase helpers, non-`.tsx` files, a
 *   single toggle, non-boolean `has*` props.
 */
import assert from 'node:assert/strict';

import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import plugin from '../../lint/plugins/house/index.ts';
import { noBooleanPropSoup } from '../../lint/plugins/house/no-boolean-prop-soup.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const RULE_NAME = 'no-boolean-prop-soup';

describe('plugin entrypoint wiring (house)', () => {
	it(`wires rules["${RULE_NAME}"] to the rule object`, () => {
		assert.strictEqual(plugin.rules[RULE_NAME], noBooleanPropSoup);
	});
});

type Options = Record<string, string[] | number | boolean>[];
const v = (code: string, options: Options = []) => ({ code, filename: 'file.tsx', options });
const i = (code: string, messageId = 'tooManyToggles', options: Options = []) => ({
	code,
	filename: 'file.tsx',
	options,
	errors: [{ messageId }],
});

new RuleTester().run(RULE_NAME, noBooleanPropSoup, {
	valid: [
		// One toggle is within the default max.
		v('const Card = (props: { hasThumb?: boolean }) => <div />;'),
		// Real element states are not toggles, bare or `is*`.
		v(
			'const Box = (props: { disabled?: boolean; open?: boolean; loading: boolean; isOpen?: boolean; isLoading?: boolean }) => <div />;',
		),
		// State words anywhere in an `is*` / `has*` name: async status, nested open flags, pagination.
		v(
			'const Bar = (props: { isPending: boolean; isDirty: boolean; isRemoveDialogOpen: boolean; hasNextPage: boolean; hasPreviousPage: boolean }) => <div />;',
		),
		// `disabled` never matches `disable*`; `has*` that is not a boolean is data.
		v('const Row = (props: { disabled: boolean; hasMore: number; showCount: string }) => <div />;'),
		// Imported / external props types are never resolved, so never reported.
		v("import type { CardProps } from './types';\nconst Card = (props: CardProps) => <div />;"),
		v(
			"import type { Base } from './types';\ninterface P extends Base { hasThumb?: boolean }\nconst Card = (props: P) => <div />;",
		),
		v('const Card = (props: Omit<ExternalProps, "x">) => <div />;'),
		// Lowercase helpers are not components.
		v('const helper = (props: { hasA: boolean; hasB: boolean }) => null;'),
		v('function helper(props: { hasA: boolean; hasB: boolean }) { return null; }'),
		// Only `.tsx` files are checked.
		{ code: 'const Card = (props: { hasA: boolean; hasB: boolean }) => null;', filename: 'file.ts' },
		// `allow` extends the allowlist (`isCompact` -> `compact`).
		v('const Card = (props: { isCompact: boolean; isDense: boolean }) => <div />;', [{ allow: ['compact', 'dense'] }]),
		// A raised `max` tolerates more toggles.
		v('const Card = (props: { hasA: boolean; hasB: boolean }) => <div />;', [{ max: 2 }]),
		// Layout unions are off by default.
		v("const List = (props: { variant: 'card' | 'row' | 'tile' }) => <div />;"),
		// A union with fewer than two layout names is a style choice.
		v("const Btn = (props: { variant: 'primary' | 'card' }) => <div />;", [{ layoutUnions: true }]),
		// A self-referencing interface terminates.
		v('interface P extends P { a: string }\nconst Card = (props: P) => <div />;'),
	],
	invalid: [
		i('const Card = (props: { hasThumb?: boolean; showPill?: boolean }) => <div />;'),
		// Optional `boolean | undefined`, and destructured params.
		i('const Card = ({ hasThumb, showPill }: { hasThumb: boolean | undefined; showPill?: boolean }) => <div />;'),
		// Same-file alias and interface.
		i('type P = { hasThumb?: boolean; withFooter?: boolean };\nconst Card = (props: P) => <div />;'),
		i('interface P { hasThumb?: boolean; hideTitle?: boolean }\nexport const Card = (props: P) => <div />;'),
		i(
			'export interface P { noBorder?: boolean; enableX?: boolean }\nexport default function Card(props: P) { return <div />; }',
		),
		// extends in the same file, toggles split across base and child.
		i(
			'interface Base { hasThumb?: boolean }\ninterface P extends Base { showPill?: boolean }\nconst Card = (props: P) => <div />;',
		),
		// Intersection with a same-file alias and an external type.
		i(
			"import type { Ext } from './x';\ntype A = { hasA?: boolean };\ntype P = A & Ext & { showB?: boolean };\nconst Card = (props: P) => <div />;",
		),
		// Function declaration / function expression.
		i('function Card(props: { hasA: boolean; hasB: boolean }) { return <div />; }'),
		i('const Card = function (props: { hasA: boolean; hasB: boolean }) { return <div />; };'),
		// memo / forwardRef, props from the parameter or the type arguments.
		i('const Card = memo((props: { hasA: boolean; hasB: boolean }) => <div />);'),
		i('const Card = React.memo(forwardRef((props: { hasA: boolean; hasB: boolean }, ref) => <div />));'),
		i(
			'type P = { hasA: boolean; hasB: boolean };\nconst Card = forwardRef<HTMLDivElement, P>((props, ref) => <div />);',
		),
		i('type P = { hasA: boolean; hasB: boolean };\nconst Card: FC<P> = (props) => <div />;'),
		// Three toggles with max 2; max 0 reports a single one.
		i('const Card = (props: { hasA: boolean; hasB: boolean; hasC: boolean }) => <div />;', 'tooManyToggles', [
			{ max: 2 },
		]),
		i('const Card = (props: { hasA: boolean }) => <div />;', 'tooManyToggles', [{ max: 0 }]),
		// An allowlisted `is*` name only counts when it is not allowed: `isCompact` is a toggle.
		i('const Card = (props: { isCompact: boolean; isOpen: boolean; isDense: boolean }) => <div />;'),
		// Layout union option.
		i("const List = (props: { variant: 'card' | 'row' | 'tile' }) => <div />;", 'layoutUnion', [
			{ layoutUnions: true },
		]),
		i("type P = { layout?: 'list' | 'grid' };\nconst List = (props: P) => <div />;", 'layoutUnion', [
			{ layoutUnions: true },
		]),
	],
});
