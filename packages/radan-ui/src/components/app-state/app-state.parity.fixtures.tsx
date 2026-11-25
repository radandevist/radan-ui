import { Button } from '../button/button.web';
import { EmptyState, ErrorState } from './app-state.web';

/**
 * Test-only: the eight ShopKartOS block compositions and the Tabler icons they pass, copied from the S0 harness so
 * `app-state.web.test.tsx` can compare them with the `block/` fixtures. Nothing here ships; no icon dependency.
 */
// The Tabler icons ShopKartOS passes, copied with their marker classes: the parity fixture contains their full DOM.
const paths = {
	'arrow-left': ['M5 12l14 0', 'M5 12l6 6', 'M5 12l6 -6'],
	link: [
		'M9 15l6 -6',
		'M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464',
		'M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463',
	],
	lock: [
		'M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6',
		'M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0',
		'M8 11v-4a4 4 0 1 1 8 0v4',
	],
	plus: ['M12 5l0 14', 'M5 12l14 0'],
	refresh: ['M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4', 'M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4'],
	'server-off': [
		'M12 12h-6a3 3 0 0 1 -3 -3v-2c0 -1.083 .574 -2.033 1.435 -2.56m3.565 -.44h10a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-2',
		'M16 12h2a3 3 0 0 1 3 3v2m-1.448 2.568a2.986 2.986 0 0 1 -1.552 .432h-12a3 3 0 0 1 -3 -3v-2a3 3 0 0 1 3 -3h6',
		'M7 8v.01',
		'M7 16v.01',
		'M3 3l18 18',
	],
	'truck-delivery': [
		'M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
		'M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
		'M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5',
		'M3 9l4 0',
	],
	'wifi-off': [
		'M12 18l.01 0',
		'M9.172 15.172a4 4 0 0 1 5.656 0',
		'M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2',
		'M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374',
		'M3 3l18 18',
	],
	'zoom-question': [
		'M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0',
		'M21 21l-6 -6',
		'M10 13l0 .01',
		'M10 10a1.5 1.5 0 1 0 -1.14 -2.474',
	],
} as const;

type IconName = keyof typeof paths;
type IconProps = { className?: string; stroke?: number; 'data-icon'?: string };

/** A Tabler icon: same attributes, same order and the `tabler-icon` marker classes as the real package. */
const tabler = (name: IconName) => {
	const Glyph = ({ className, stroke = 2, 'data-icon': dataIcon }: IconProps) => (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={stroke}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className ? `tabler-icon tabler-icon-${name} ${className}` : `tabler-icon tabler-icon-${name}`}
			data-icon={dataIcon}
		>
			{paths[name].map((d) => (
				<path key={d} d={d} />
			))}
		</svg>
	);
	return Glyph;
};

const WifiOff = tabler('wifi-off');
const Link = tabler('link');
const ArrowLeft = tabler('arrow-left');
const Refresh = tabler('refresh');
const Plus = tabler('plus');
const ZoomQuestion = tabler('zoom-question');
const Lock = tabler('lock');
const ServerOff = tabler('server-off');
const TruckDelivery = tabler('truck-delivery');

// ShopKartOS's two actions, at the exact props of its ErrorCard (44 px, the link through radan-ui's Button render).
const Retry = () => (
	<Button className="h-11 px-4">
		<Refresh data-icon="inline-start" />
		Try again
	</Button>
);

const Back = ({ variant = 'outline' }: { variant?: 'outline' | 'default' }) => (
	<Button variant={variant} className="h-11 px-4" render={<a href="/" />} nativeButton={false} role="link">
		<ArrowLeft data-icon="inline-start" />
		Back to home
	</Button>
);

const offlineText = 'Check your Wi-Fi or mobile data. The page reloads by itself as soon as the network is back.';

const compositions = {
	'error-info': (
		<ErrorState data-kind="offline">
			<ErrorState.Pictogram icon={WifiOff} tone="info" />
			<ErrorState.Title>No connection</ErrorState.Title>
			<ErrorState.Description>{offlineText}</ErrorState.Description>
			<ErrorState.Actions>
				<Retry />
				<Back />
			</ErrorState.Actions>
		</ErrorState>
	),
	'error-neutral': (
		<ErrorState data-kind="not_found">
			<ErrorState.Pictogram icon={ZoomQuestion} tone="neutral" />
			<ErrorState.Title>Page not found</ErrorState.Title>
			<ErrorState.Description>The link may be wrong, or it no longer exists in this space.</ErrorState.Description>
			<ErrorState.Actions>
				<Retry />
				<Back />
			</ErrorState.Actions>
		</ErrorState>
	),
	'error-warning': (
		<ErrorState data-kind="forbidden">
			<ErrorState.Pictogram icon={Lock} tone="warning" />
			<ErrorState.Title>Access denied</ErrorState.Title>
			<ErrorState.Description>
				Your account does not have access to this page. Ask an owner of the space if you need it.
			</ErrorState.Description>
			<ErrorState.Actions>
				<Back variant="default" />
			</ErrorState.Actions>
		</ErrorState>
	),
	'error-danger': (
		<ErrorState data-kind="server">
			<ErrorState.Pictogram icon={ServerOff} tone="danger" />
			<ErrorState.Title>Something went wrong</ErrorState.Title>
			<ErrorState.Description>Loading took too long: try again.</ErrorState.Description>
			<ErrorState.Actions>
				<Retry />
				<Back />
			</ErrorState.Actions>
		</ErrorState>
	),
	'error-status': (
		<ErrorState role="status" data-kind="offline">
			<ErrorState.Pictogram icon={WifiOff} tone="info" />
			<ErrorState.Title>No connection</ErrorState.Title>
			<ErrorState.Description>{offlineText}</ErrorState.Description>
			<ErrorState.Actions>
				<Retry />
				<Back />
			</ErrorState.Actions>
			<ErrorState.Details label="Technical details">
				{'TypeError: Failed to fetch\n    at state-capture:offline'}
			</ErrorState.Details>
		</ErrorState>
	),
	'error-details': (
		<ErrorState data-kind="server">
			<ErrorState.Pictogram icon={ServerOff} tone="danger" />
			<ErrorState.Title>Something went wrong</ErrorState.Title>
			<ErrorState.Description>Loading took too long: try again.</ErrorState.Description>
			<ErrorState.Actions>
				<Retry />
				<Back />
			</ErrorState.Actions>
			<ErrorState.Details label="Technical details">
				{'Error: load_timeout\n    at StateCapture (state-capture:server)'}
			</ErrorState.Details>
		</ErrorState>
	),
	'empty-default': (
		<EmptyState>
			<EmptyState.Pictogram icon={TruckDelivery} />
			<EmptyState.Title>No forwarders</EmptyState.Title>
			<EmptyState.Text>
				Add the forwarder who receives your parcels in China: its rates and delays drive the freight.
			</EmptyState.Text>
			<EmptyState.Actions>
				<Button className="h-11 md:h-9">
					<Plus data-icon="inline-start" /> New forwarder
				</Button>
			</EmptyState.Actions>
		</EmptyState>
	),
	'empty-compact': (
		<EmptyState size="compact">
			<EmptyState.Pictogram icon={Link} className="text-status-success" />
			<EmptyState.Title>All attached</EmptyState.Title>
			<EmptyState.Text>Every parcel on the tracking site matches an item.</EmptyState.Text>
		</EmptyState>
	),
};

export { compositions, Link, WifiOff };
