import { Skeleton } from '@radandevist/radan-ui/skeleton';
import type { SkeletonLineSize } from '@radandevist/radan-ui/skeleton';

// A catalog page: every part of the library, nothing random (the screenshot must be stable).
const sizes: SkeletonLineSize[] = ['xs', 'sm', 'md', 'lg'];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
		{children}
	</section>
);

const SkeletonPage = () => (
	<main className="mx-auto max-w-3xl p-6">
		<h1 className="mb-6 text-xl font-semibold">Skeleton</h1>
		<Section title="Skeleton.Line, one per size">
			<Skeleton>
				{sizes.map((size) => (
					<Skeleton.Line key={size} size={size} width="w-48" />
				))}
			</Skeleton>
		</Section>
		<Section title="Skeleton.Pill">
			<Skeleton className="flex-row">
				<Skeleton.Pill width="w-14" />
				<Skeleton.Pill width="w-20" />
				<Skeleton.Pill width="w-28" />
			</Skeleton>
		</Section>
		<Section title="Skeleton.Text">
			<Skeleton className="max-w-sm">
				<Skeleton.Text lines={1} />
				<Skeleton.Text lines={3} size="md" />
			</Skeleton>
		</Section>
		<Section title="Skeleton.Card (header + body)">
			<Skeleton.Card>
				<Skeleton.Card.Header>
					<Skeleton.Line size="sm" width="w-16" />
					<Skeleton.Pill width="w-14" />
				</Skeleton.Card.Header>
				<Skeleton.Card.Body>
					<Skeleton.Text lines={2} size="xs" />
				</Skeleton.Card.Body>
			</Skeleton.Card>
		</Section>
		<Section title="Cards composed in a region (one status)">
			<Skeleton>
				{[1, 2].map((key) => (
					<Skeleton.Card key={key}>
						<Skeleton.Card.Header>
							<Skeleton.Line size="md" width="w-32" />
						</Skeleton.Card.Header>
						<Skeleton.Card.Body>
							<Skeleton.Text lines={3} size="sm" />
						</Skeleton.Card.Body>
					</Skeleton.Card>
				))}
			</Skeleton>
		</Section>
	</main>
);

export default SkeletonPage;
