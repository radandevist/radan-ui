import { EmptyState, ErrorState } from '@radandevist/radan-ui/app-state';
import { Button } from '@radandevist/radan-ui/button';
import { Card } from '@radandevist/radan-ui/card';

// A catalog page: every tone, both empty sizes and the disclosure, statically (no clock, no randomness).
// A 24-viewBox stroke icon, like the ones the apps pass.
const icon = (d: string) => {
	const CatalogIcon = ({ className, stroke = 2 }: { className?: string; stroke?: number }) => (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={stroke}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d={d} />
		</svg>
	);
	return CatalogIcon;
};

const WifiOff = icon(
	'M3 3l18 18M12 18l.01 0M9.172 15.172a4 4 0 0 1 5.656 0M6.343 12.343a8 8 0 0 1 3.864 -2.14m4.163 .155a8 8 0 0 1 3.287 2M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374',
);
const ZoomQuestion = icon(
	'M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6 -6M10 13l0 .01M10 10a1.5 1.5 0 1 0 -1.14 -2.474',
);
const Lock = icon(
	'M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0M8 11v-4a4 4 0 1 1 8 0v4',
);
const ServerOff = icon(
	'M12 12h-6a3 3 0 0 1 -3 -3v-2a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-2M16 12h2a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-2a3 3 0 0 1 3 -3h6M7 8v.01M7 16v.01M3 3l18 18',
);
const AlertTriangle = icon(
	'M12 9v4M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0M12 16h.01',
);
const TruckDelivery = icon(
	'M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5M3 9l4 0',
);
const Search = icon('M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M21 21l-6 -6');
const Link = icon(
	'M9 15l6 -6M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463',
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
		{children}
	</section>
);

const ErrorActions = () => (
	<ErrorState.Actions>
		<Button className="h-11 px-4">Try again</Button>
		<Button variant="outline" className="h-11 px-4">
			Back to home
		</Button>
	</ErrorState.Actions>
);

const AppStatePage = () => (
	<main className="mx-auto max-w-5xl p-6">
		<h1 className="mb-6 text-xl font-semibold">App state</h1>
		<Section title="Error — not found (neutral)">
			<ErrorState>
				<ErrorState.Pictogram icon={ZoomQuestion} tone="neutral" />
				<ErrorState.Title>Page not found</ErrorState.Title>
				<ErrorState.Description>The link may be wrong, or it no longer exists in this space.</ErrorState.Description>
				<ErrorActions />
			</ErrorState>
		</Section>
		<Section title="Error — forbidden (warning, home only)">
			<ErrorState>
				<ErrorState.Pictogram icon={Lock} tone="warning" />
				<ErrorState.Title>Access denied</ErrorState.Title>
				<ErrorState.Description>
					Your account does not have access to this page. Ask an owner of the space if you need it.
				</ErrorState.Description>
				<ErrorState.Actions>
					<Button className="h-11 px-4">Back to home</Button>
				</ErrorState.Actions>
			</ErrorState>
		</Section>
		<Section title="Error — offline (status, with details)">
			<ErrorState role="status">
				<ErrorState.Pictogram icon={WifiOff} tone="info" />
				<ErrorState.Title>No connection</ErrorState.Title>
				<ErrorState.Description>
					Check your Wi-Fi or mobile data. The page reloads by itself as soon as the network is back.
				</ErrorState.Description>
				<ErrorActions />
				<ErrorState.Details label="Technical details">
					{'TypeError: Failed to fetch\n    at loadRoute (router.tsx:45)'}
				</ErrorState.Details>
			</ErrorState>
		</Section>
		<Section title="Error — server (danger, with details)">
			<ErrorState>
				<ErrorState.Pictogram icon={ServerOff} tone="danger" />
				<ErrorState.Title>Something went wrong</ErrorState.Title>
				<ErrorState.Description>Loading took too long: try again.</ErrorState.Description>
				<ErrorActions />
				<ErrorState.Details label="Technical details">
					{'Error: load_timeout\n    at loadRoute (router.tsx:45)'}
				</ErrorState.Details>
			</ErrorState>
		</Section>
		<Section title="Error — unknown (danger)">
			<ErrorState>
				<ErrorState.Pictogram icon={AlertTriangle} tone="danger" />
				<ErrorState.Title>Could not load the data</ErrorState.Title>
				<ErrorState.Description>Something unexpected happened. Try again, then reload the page.</ErrorState.Description>
				<ErrorActions />
			</ErrorState>
		</Section>
		<Section title="Empty — default, with two actions">
			<EmptyState>
				<EmptyState.Pictogram icon={TruckDelivery} />
				<EmptyState.Title>No forwarders</EmptyState.Title>
				<EmptyState.Text>
					Add the forwarder who receives your parcels in China: its rates and delays drive the freight.
				</EmptyState.Text>
				<EmptyState.Actions>
					<Button className="h-11 md:h-9">New forwarder</Button>
					<Button variant="outline" className="h-11 md:h-9">
						See the guide
					</Button>
				</EmptyState.Actions>
			</EmptyState>
		</Section>
		<Section title="Empty — default, without actions">
			<EmptyState>
				<EmptyState.Pictogram icon={Search} />
				<EmptyState.Title>No match</EmptyState.Title>
				<EmptyState.Text>No forwarder matches this filter. Clear it to see them all.</EmptyState.Text>
			</EmptyState>
		</Section>
		<Section title="Empty — compact in a card (success tint)">
			<Card>
				<Card.Body className="p-0">
					<EmptyState size="compact">
						<EmptyState.Pictogram icon={Link} className="text-status-success" />
						<EmptyState.Title>All attached</EmptyState.Title>
						<EmptyState.Text>Every parcel on the tracking site matches an item.</EmptyState.Text>
					</EmptyState>
				</Card.Body>
			</Card>
		</Section>
	</main>
);

export default AppStatePage;
