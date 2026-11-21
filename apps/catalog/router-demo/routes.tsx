import { Bone } from '@radandevist/radan-ui/bone';
import { BoneRegion } from '@radandevist/radan-ui/bone-region';
import { useGoBack, usePageTitle, useShownPath } from '@radandevist/radan-ui/page-transition-tanstack-router';
import { PageTitleProvider, PhoneTopBar } from '@radandevist/radan-ui/phone-top-bar';
import { createRootRoute, createRoute, Link, Outlet, useParams } from '@tanstack/react-router';

// A real, tiny app for radan-ui's own end-to-end run (spec §9.4): three top-level pages, a detail page, every page behind
// a loader that is a network request (so nav-stress can hold it back) and a skeleton.
const DATA = `${import.meta.env.BASE_URL}router-demo-data.json`;
const load = async (key: string) => {
	await fetch(`${DATA}?key=${encodeURIComponent(key)}&t=${Date.now()}`);
	return key;
};

const Pending = () => (
	<BoneRegion className="space-y-3 p-4">
		<Bone className="h-6 w-1/2 rounded-md" />
		<Bone className="h-24 w-full rounded-lg" />
	</BoneRegion>
);

const Shell = () => {
	const path = useShownPath();
	return (
		<PageTitleProvider>
			<PhoneTopBar>
				<PhoneTopBar.Menu label="Open navigation" onPress={() => {}} />
				<PhoneTopBar.Title path={path} fallback="Router demo" pageName="Router demo" />
				<PhoneTopBar.Actions />
			</PhoneTopBar>
			<Outlet />
		</PageTitleProvider>
	);
};

// A slow root `beforeLoad` (ShopKartOS's session read): the router offers no skeleton until it answers, the early offer does.
const root = createRootRoute({ beforeLoad: () => load('session'), component: Shell, pendingComponent: Pending });

const links = ['/', '/pickups', '/settings', '/pickups/P-1', '/pickups/P-2'] as const;
const Page = ({ title }: { title: string }) => {
	usePageTitle(title);
	return (
		<main className="space-y-3 p-4">
			<h1 className="sr-only md:not-sr-only">{title}</h1>
			<nav className="flex flex-wrap gap-3 text-sm underline">
				{links.map((to) => (
					<Link key={to} to={to}>
						{to}
					</Link>
				))}
			</nav>
		</main>
	);
};

const page = (path: string, title: string) =>
	createRoute({
		getParentRoute: () => root,
		path,
		loader: () => load(path),
		pendingComponent: Pending,
		component: () => <Page title={title} />,
	});

const Detail = () => {
	const { id } = useParams({ strict: false });
	const back = useGoBack('/pickups');
	usePageTitle(`Pickup ${id}`);
	return (
		<main className="space-y-3 p-4">
			<PhoneTopBar.Back label="Back" onBack={back} />
			<h1 className="sr-only md:not-sr-only">Pickup {id}</h1>
			<Link to="/pickups" className="text-sm underline">
				/pickups
			</Link>
		</main>
	);
};

const detail = createRoute({
	getParentRoute: () => root,
	path: '/pickups/$id',
	loader: ({ params }) => load(`/pickups/${params.id}`),
	pendingComponent: Pending,
	component: Detail,
});

export const routeTree = root.addChildren([
	page('/', 'Home'),
	page('/pickups', 'Pickups'),
	page('/settings', 'Settings'),
	detail,
]);
