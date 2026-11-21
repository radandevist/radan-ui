// @vitest-environment jsdom
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@tanstack/react-router';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageTitleProvider, PhoneTopBar } from '../phone-top-bar/phone-top-bar.web';
import { useGoBack, usePageTitle, useShownPath } from './page-transition-tanstack-router.web';

afterEach(cleanup);

const Bar = () => <PhoneTopBar.Title path={useShownPath()} fallback="Fallback" />;

describe('the hooks, in a real router', () => {
	const setup = (...entries: string[]) => {
		const root = createRootRoute({
			component: () => (
				<PageTitleProvider>
					<Bar />
					<Outlet />
				</PageTitleProvider>
			),
		});
		const Page = () => {
			usePageTitle('Detail title');
			const goBack = useGoBack('/');
			return (
				<button type="button" onClick={() => void goBack()}>
					detail body
				</button>
			);
		};
		const detail = createRoute({ getParentRoute: () => root, path: '/detail', component: Page });
		const home = createRoute({ getParentRoute: () => root, path: '/', component: () => <p>home body</p> });
		return createRouter({
			routeTree: root.addChildren([home, detail]),
			history: createMemoryHistory({ initialEntries: entries, initialIndex: entries.length - 1 }),
		});
	};

	it('usePageTitle publishes under the shown path, and the bar shows it instead of the fallback', async () => {
		render(<RouterProvider router={setup('/detail')} />);
		await waitFor(() => expect(screen.getByText('Detail title')).toBeTruthy());
	});

	it('useGoBack replaces the page with the fallback when there is no earlier entry (a deep link)', async () => {
		const router = setup('/detail');
		const back = vi.spyOn(router.history, 'back');
		const navigate = vi.spyOn(router, 'navigate');
		render(<RouterProvider router={router} />);
		fireEvent.click(await screen.findByText('detail body'));
		await waitFor(() => screen.getByText('home body'));
		expect(navigate).toHaveBeenCalledWith({ to: '/', replace: true });
		expect(back).not.toHaveBeenCalled();
	});

	it('useGoBack goes back one entry, with no navigation of its own, when the app has history', async () => {
		const router = setup('/', '/detail');
		const back = vi.spyOn(router.history, 'back');
		const navigate = vi.spyOn(router, 'navigate');
		render(<RouterProvider router={router} />);
		fireEvent.click(await screen.findByText('detail body'));
		expect(back).toHaveBeenCalledOnce();
		expect(navigate).not.toHaveBeenCalled();
	});
});
