import { installLoadGuard } from '@radandevist/radan-ui/load-guard';
import { createPageTransitions } from '@radandevist/radan-ui/page-transition-tanstack-router';
import { createHashHistory, createRouter } from '@tanstack/react-router';

import { routeTree } from './routes';

// The wiring an app writes (spec §5.2): the router options, then `install`. Hash history: the demo is a static page.
const pageTransitions = createPageTransitions();

export const getRouter = () => {
	const router = createRouter({ routeTree, history: createHashHistory(), ...pageTransitions.routerOptions });
	pageTransitions.install(router);
	// The data requests are this app's loaders: nets 2 and 3 of the never-infinite-skeleton guarantee.
	installLoadGuard(router, { isLoaderCall: (input) => String(input).includes('router-demo-data.json') });
	return router;
};
