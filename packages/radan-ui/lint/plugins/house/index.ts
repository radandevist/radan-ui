import type { Plugin } from '@oxlint/plugins';

import { arrowFunctionComponents } from './arrow-function-components.ts';
import { noArrayReduce } from './no-array-reduce.ts';
import { noBooleanPropSoup } from './no-boolean-prop-soup.ts';
import { noConsoleInSource } from './no-console-in-source.ts';
import { noIife } from './no-iife.ts';
import { noNeverAnyCasts } from './no-never-any-casts.ts';
import { preferEarlyReturn } from './prefer-early-return.ts';

/**
 * House rules: the coding style shared by Radan's apps (the generic half of ShopKartOS's rules).
 *
 * A plain plugin object, not `eslintCompatPlugin(...)`: every rule below uses
 * `create`, and `eslintCompatPlugin` only converts `createOnce` rules. Dropping
 * it keeps `@oxlint/plugins` a type-only import, so the published plugin has no
 * runtime dependency (consumers install none).
 */
export default {
	meta: { name: 'house' },
	rules: {
		'arrow-function-components': arrowFunctionComponents,
		'no-array-reduce': noArrayReduce,
		'no-boolean-prop-soup': noBooleanPropSoup,
		'no-console-in-source': noConsoleInSource,
		'no-iife': noIife,
		'no-never-any-casts': noNeverAnyCasts,
		'prefer-early-return': preferEarlyReturn,
	},
} satisfies Plugin;
