import { withLoadTimeout, type IsLoaderCall } from './load-guard.timeout';
import { watchLoad, type Guarded } from './load-guard.watch';

export {
	FETCH_LIMIT_MS,
	isLoadTimeout,
	isServerFnGet,
	LOAD_TIMEOUT,
	NO_LOAD_TIMEOUT,
	withLoadTimeout,
} from './load-guard.timeout';
export type { IsLoaderCall } from './load-guard.timeout';
export { PENDING_LIMIT_MS, watchLoad } from './load-guard.watch';
export type { Guarded } from './load-guard.watch';

let uninstall: (() => void) | undefined;
/**
 * Browser only; idempotent (a second call returns the first one's undo). Wraps `window.fetch` and starts `watchLoad`;
 * the returned function undoes both. In dev, the app calls `import.meta.hot?.dispose(undo)` so nothing wraps twice or leaks a timer.
 */
export const installLoadGuard = (router: Guarded, options: { isLoaderCall: IsLoaderCall }) => {
	if (uninstall || !globalThis.window) {
		return uninstall ?? (() => {});
	}
	const original = window.fetch;
	window.fetch = withLoadTimeout(original.bind(window), options);
	const stop = watchLoad(router);
	uninstall = () => {
		window.fetch = original;
		stop();
		uninstall = undefined;
	};
	return uninstall;
};
