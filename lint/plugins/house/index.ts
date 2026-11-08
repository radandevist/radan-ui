import { eslintCompatPlugin } from '@oxlint/plugins';

import { arrowFunctionComponents } from './arrow-function-components.ts';
import { noArrayReduce } from './no-array-reduce.ts';
import { noConsoleInSource } from './no-console-in-source.ts';
import { noIife } from './no-iife.ts';
import { noNeverAnyCasts } from './no-never-any-casts.ts';
import { preferEarlyReturn } from './prefer-early-return.ts';

/** House rules: the coding style shared by Radan's apps (the generic half of ShopKartOS's rules). */
export default eslintCompatPlugin({
	meta: { name: 'house' },
	rules: {
		'arrow-function-components': arrowFunctionComponents,
		'no-array-reduce': noArrayReduce,
		'no-console-in-source': noConsoleInSource,
		'no-iife': noIife,
		'no-never-any-casts': noNeverAnyCasts,
		'prefer-early-return': preferEarlyReturn,
	},
});
