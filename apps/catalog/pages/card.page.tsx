import { BoneLine } from '@radandevist/radan-ui/bone-line';
import { BonePill } from '@radandevist/radan-ui/bone-pill';
import { BoneRegion } from '@radandevist/radan-ui/bone-region';
import { BoneText } from '@radandevist/radan-ui/bone-text';
import { Card } from '@radandevist/radan-ui/card';

// A catalog page: the card, its skeleton, and the skeleton in a list (nothing random: the screenshot must be stable).
// A 24-viewBox stroke icon, like the ones the apps pass.
const truck = (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M10 17h4V5H2v12h3m10 0h-1m1-8h4l3 4v4h-2m-5 0a2 2 0 1 1-4 0m-5 0a2 2 0 1 1-4 0" />
	</svg>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
		{children}
	</section>
);

const CardPage = () => (
	<main className="mx-auto max-w-3xl p-6">
		<h1 className="mb-6 text-xl font-semibold">Card</h1>
		<Section title="Card (header + body)">
			<Card>
				<Card.Header>
					<Card.Header.Heading>
						<Card.Header.Icon>{truck}</Card.Header.Icon>
						<Card.Header.Label>Transport modes</Card.Header.Label>
					</Card.Header.Heading>
					<span className="inline-flex h-6 items-center rounded-3xl bg-secondary px-2.5 text-xs text-secondary-foreground">
						2 to confirm
					</span>
				</Card.Header>
				<Card.Body>
					<p className="text-xs text-muted-foreground">One short line of text in the body.</p>
				</Card.Body>
			</Card>
		</Section>
		<Section title="Card.Skeleton (the same silhouette as the card above: one bone per element)">
			<Card.Skeleton>
				<Card.Header.Skeleton>
					<Card.Header.Heading.Skeleton>
						<Card.Header.Icon.Skeleton />
						<Card.Header.Label.Skeleton width="w-32" />
					</Card.Header.Heading.Skeleton>
					<BonePill width="w-24" />
				</Card.Header.Skeleton>
				<Card.Body.Skeleton>
					<BoneLine size="sm" width="w-2/3" />
				</Card.Body.Skeleton>
			</Card.Skeleton>
		</Section>
		<Section title="Cards composed in a region (one status)">
			<BoneRegion>
				{[1, 2].map((key) => (
					<Card.Skeleton key={key}>
						<Card.Header.Skeleton>
							<Card.Header.Heading.Skeleton>
								<Card.Header.Icon.Skeleton />
								<Card.Header.Label.Skeleton width="w-28" />
							</Card.Header.Heading.Skeleton>
						</Card.Header.Skeleton>
						<Card.Body.Skeleton>
							<BoneText lines={3} size="sm" />
						</Card.Body.Skeleton>
					</Card.Skeleton>
				))}
			</BoneRegion>
		</Section>
	</main>
);

export default CardPage;
