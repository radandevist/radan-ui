import { Input, InputSkeleton } from '@radandevist/radan-ui/input';

// A catalog page: every state of the field, nothing random (the screenshot must be stable).
const Row = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-6 max-w-sm">
		<h2 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
		{children}
	</section>
);

const InputPage = () => (
	<main className="mx-auto max-w-3xl p-6">
		<h1 className="mb-6 text-xl font-semibold">Input</h1>
		<Row title="default (16 px below md, 14 px from md)">
			<Input accessibilityLabel="Default" placeholder="Search an order" />
		</Row>
		<Row title="with a value">
			<Input accessibilityLabel="Value" defaultValue="IE-SP-4821" />
		</Row>
		<Row title="invalid">
			<Input accessibilityLabel="Invalid" defaultValue="not-an-email" invalid />
		</Row>
		<Row title="disabled">
			<Input accessibilityLabel="Disabled" defaultValue="Locked" disabled />
		</Row>
		<Row title="password">
			<Input accessibilityLabel="Password" type="password" defaultValue="secret" />
		</Row>
		<Row title="InputSkeleton">
			<InputSkeleton />
		</Row>
	</main>
);

export default InputPage;
