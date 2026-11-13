import { Button } from '@radandevist/radan-ui/button';
import type { ButtonSize, ButtonVariant } from '@radandevist/radan-ui/button';

// A catalog page: every variant, size and state of the component, nothing random (the screenshot must be stable).
const variants: ButtonVariant[] = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'];
const sizes: ButtonSize[] = ['default', 'xs', 'sm', 'lg'];

const Row = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-8">
		<h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
		<div className="flex flex-wrap items-center gap-3">{children}</div>
	</section>
);

const ButtonPage = () => (
	<main className="mx-auto max-w-3xl p-6">
		<h1 className="mb-6 text-xl font-semibold">Button</h1>
		{sizes.map((size) => (
			<Row key={size} title={`size ${size}`}>
				{variants.map((variant) => (
					<Button key={variant} variant={variant} size={size}>
						{variant}
					</Button>
				))}
			</Row>
		))}
		<Row title="size icon">
			{variants.map((variant) => (
				<Button key={variant} variant={variant} size="icon" accessibilityLabel={variant}>
					+
				</Button>
			))}
		</Row>
		<Row title="disabled">
			{variants.map((variant) => (
				<Button key={variant} variant={variant} disabled>
					{variant}
				</Button>
			))}
		</Row>
		<Row title="loading">
			{variants.map((variant) => (
				<Button key={variant} variant={variant} loading>
					{variant}
				</Button>
			))}
		</Row>
		<Row title="className / labelClassName">
			<Button className="rounded-card" labelClassName="text-status-success" variant="outline">
				rounded-card, success label
			</Button>
		</Row>
	</main>
);

export default ButtonPage;
