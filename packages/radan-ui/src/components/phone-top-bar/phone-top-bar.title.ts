import { createContext } from 'react';

import type { PageTitle } from './phone-top-bar.contract';

/**
 * The shell's page-title slot: pages publish the title they draw (`usePageTitle`, in the router adapter), the bar shows
 * it below md. The shell has no other source: it never guesses a page's title from its path.
 */
export const PageTitleContext = createContext<{
	published: PageTitle | undefined;
	publish: (published: PageTitle) => void;
}>({ published: undefined, publish: () => {} });

/** The title the bar shows below md: the page's own once it is mounted, the server's fallback until then. */
export const shownPageTitle = (published: PageTitle | undefined, path: string, fallback: string): string =>
	published?.path === path ? published.title : fallback;
