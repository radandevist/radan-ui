import { expect, test } from 'vitest';

import { DEFAULT_PREFIX } from '../src/index';

test('the default CSS prefix is radan-ui', () => {
	expect(DEFAULT_PREFIX).toBe('radan-ui');
});
