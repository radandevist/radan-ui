import { Bone } from '@radandevist/radan-ui/bone';
import { BoneLine } from '@radandevist/radan-ui/bone-line';
import type { BoneLineSize } from '@radandevist/radan-ui/bone-line';
import { BonePill } from '@radandevist/radan-ui/bone-pill';
import { BoneRegion } from '@radandevist/radan-ui/bone-region';
import { BoneText } from '@radandevist/radan-ui/bone-text';

// A catalog page: every generic bone, imported one by one (nothing random: the screenshot must be stable).
// The skeletons that mirror a component live on that component's page (`Card.Skeleton`, `Button.Skeleton`, …).
const sizes: BoneLineSize[] = ['xs', 'sm', 'md', 'lg'];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
		{children}
	</section>
);

const BonePage = () => (
	<main className="mx-auto max-w-3xl p-6">
		<h1 className="mb-6 text-xl font-semibold">Bone</h1>
		<Section title="BoneLine, one per size">
			<BoneRegion>
				{sizes.map((size) => (
					<BoneLine key={size} size={size} width="w-48" />
				))}
			</BoneRegion>
		</Section>
		<Section title="BonePill">
			<BoneRegion className="flex-row">
				<BonePill width="w-14" />
				<BonePill width="w-20" />
				<BonePill width="w-28" />
			</BoneRegion>
		</Section>
		<Section title="BoneText">
			<BoneRegion className="max-w-sm">
				<BoneText lines={1} />
				<BoneText lines={3} size="md" />
			</BoneRegion>
		</Section>
		<Section title="Bone (any shape, from the className)">
			<BoneRegion className="flex-row">
				<Bone className="size-10 rounded-xl" />
				<Bone className="size-10 rounded-full" />
			</BoneRegion>
		</Section>
	</main>
);

export default BonePage;
