import {
	PageBack,
	PageBackSkeleton,
	directionOf,
	type Direction,
	type Place,
} from '@radandevist/radan-ui/page-transition';
import type { CSSProperties } from 'react';

// A catalog page: the states shown statically (no animation, no clock, no router), so the screenshot is stable.
// Each frame is the transition frozen halfway: the CSS keyframes of page-transition.css, evaluated at 50 %.
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
		{children}
	</section>
);

// `fade` is the layer's opacity, folded into its fill (the arriving page keeps an opaque background under it).
type Layer = { translate?: string; filter?: string; fade?: number };
type Frame = { old: Layer; next: Layer; oldOnTop?: boolean };
const frames: { title: string; frame: Frame }[] = [
	{
		title: 'iPhone, push',
		frame: { old: { translate: '-15% 0', filter: 'brightness(0.95)' }, next: { translate: '50% 0' } },
	},
	{
		title: 'iPhone, back',
		frame: { old: { translate: '50% 0' }, next: { translate: '-15% 0', filter: 'brightness(0.95)' }, oldOnTop: true },
	},
	{
		title: 'Material, push',
		frame: { old: { translate: '-15px 0', fade: 0.4 }, next: { translate: '15px 0', fade: 0.4 } },
	},
	{
		title: 'Material, back',
		frame: { old: { translate: '15px 0', fade: 0.4 }, next: { translate: '-15px 0', fade: 0.4 } },
	},
	{ title: 'Fade (sections)', frame: { old: { fade: 0.5 }, next: { fade: 0.5 } } },
];

// The leaving page is striped, the arriving one solid: told apart by pattern, not only by tone (dark mode included).
const stripes: CSSProperties = {
	backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0 2px, transparent 2px 8px)',
	color: 'color-mix(in oklab, var(--color-foreground) 35%, transparent)',
};
const solid: CSSProperties = { backgroundColor: 'color-mix(in oklab, var(--color-foreground) 30%, transparent)' };

const Screen = ({
	look,
	layer,
	top,
	arriving,
}: {
	look: CSSProperties;
	layer: Layer;
	top?: boolean;
	arriving?: boolean;
}) => (
	<div
		className="absolute inset-0"
		style={{
			translate: layer.translate,
			filter: layer.filter,
			zIndex: top ? 2 : 1,
			backgroundColor: arriving ? 'var(--color-background)' : undefined,
		}}
	>
		<div className="absolute inset-0" style={{ ...look, opacity: layer.fade }} />
	</div>
);

const Mock = ({ frame }: { frame: Frame }) => (
	<div className="relative h-44 w-24 overflow-hidden rounded-lg border border-border bg-background">
		<Screen look={stripes} layer={frame.old} top={frame.oldOnTop} />
		<Screen look={solid} layer={frame.next} top={!frame.oldOnTop} arriving />
	</div>
);

const at = (path: string, index: number, overlay = false): Place => ({ path, index, overlay });
const rules: { navigation: string; direction: Direction | undefined }[] = [
	{ navigation: 'first load', direction: directionOf(undefined, at('/pickups', 0)) },
	{ navigation: 'section to section', direction: directionOf(at('/pickups', 1), at('/forwarders', 2)) },
	{ navigation: 'list to detail', direction: directionOf(at('/pickups', 1), at('/pickups/P-4', 2)) },
	{ navigation: 'detail to list, earlier entry', direction: directionOf(at('/pickups/P-4', 2), at('/pickups', 1)) },
	{
		navigation: 'arrow with no earlier entry',
		direction: directionOf(at('/pickups/P-4', 0), at('/pickups', 0), { toParent: true }),
	},
	{
		navigation: 'forward to a later entry',
		direction: directionOf(at('/pickups', 1), at('/pickups/P-4', 2), { traversal: true }),
	},
	{ navigation: 'overlay sheet opens', direction: directionOf(at('/', 1), at('/', 2, true)) },
	{ navigation: 'replace, same entry', direction: directionOf(at('/pickups', 1), at('/forwarders', 1)) },
];

const PageTransitionPage = () => (
	<main className="mx-auto max-w-3xl p-6">
		<h1 className="mb-6 text-xl font-semibold">Page transitions</h1>
		<Section title="Styles and directions, frozen halfway">
			<p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
				<span className="inline-block size-5 rounded-sm border border-border" style={stripes} /> striped: leaving page
				<span className="ml-3 inline-block size-5 rounded-sm border border-border" style={solid} /> solid: arriving page
			</p>
			<div className="flex flex-wrap gap-4">
				{frames.map(({ title, frame }) => (
					<figure key={title} className="flex flex-col items-center gap-2">
						<Mock frame={frame} />
						<figcaption className="text-xs text-muted-foreground">{title}</figcaption>
					</figure>
				))}
			</div>
		</Section>
		<Section title="directionOf: which direction a navigation gets">
			<table className="w-full max-w-md text-sm">
				<tbody>
					{rules.map(({ navigation, direction }) => (
						<tr key={navigation} className="border-b border-border">
							<td className="py-1.5">{navigation}</td>
							<td className="py-1.5 font-medium">{direction ?? 'none'}</td>
						</tr>
					))}
				</tbody>
			</table>
		</Section>
		<Section title="PageBack and PageBackSkeleton">
			<div className="flex items-center gap-4">
				<PageBack label="Back" onBack={() => {}} />
				<PageBackSkeleton />
			</div>
		</Section>
	</main>
);

export default PageTransitionPage;
