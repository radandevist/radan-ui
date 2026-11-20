import { BoneLine } from '@radandevist/radan-ui/bone-line';
import { BonePill } from '@radandevist/radan-ui/bone-pill';
import { BoneRegion } from '@radandevist/radan-ui/bone-region';
import { BoneText } from '@radandevist/radan-ui/bone-text';
import { Card } from '@radandevist/radan-ui/card';

// A catalog page: the card, its skeleton, and the skeleton in a list (nothing random: the screenshot must be stable).
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
					<span className="text-sm font-medium">Title</span>
					<span className="text-xs text-muted-foreground">Status</span>
				</Card.Header>
				<Card.Body>
					<p className="text-xs text-muted-foreground">Two short lines of text inside the body of the card.</p>
				</Card.Body>
			</Card>
		</Section>
		<Section title="Card.Skeleton (Card.Header.Skeleton + Card.Body.Skeleton)">
			<Card.Skeleton>
				<Card.Header.Skeleton>
					<BoneLine size="sm" width="w-16" />
					<BonePill width="w-14" />
				</Card.Header.Skeleton>
				<Card.Body.Skeleton>
					<BoneText lines={2} size="xs" />
				</Card.Body.Skeleton>
			</Card.Skeleton>
		</Section>
		<Section title="Cards composed in a region (one status)">
			<BoneRegion>
				{[1, 2].map((key) => (
					<Card.Skeleton key={key}>
						<Card.Header.Skeleton>
							<BoneLine size="md" width="w-32" />
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
