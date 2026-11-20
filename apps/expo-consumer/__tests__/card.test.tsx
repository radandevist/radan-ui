import { readFileSync } from 'node:fs';

import { Card } from '@radandevist/radan-ui/card';
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { registerCSS } from 'react-native-css/jest';

const css = readFileSync('node_modules/.cache/tailwind-out.css', 'utf8');
beforeEach(() => {
	registerCSS(css, { inlineVariables: false, inlineRem: 16 });
});

const flat = (style: unknown) => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

test('the real card is the card surface, with its header and body, and no busy state', async () => {
	await render(
		<Card>
			<Card.Header>
				<Text>head</Text>
			</Card.Header>
			<Card.Body>
				<Text>body</Text>
			</Card.Body>
		</Card>,
	);
	expect(screen.getByText('head')).toBeTruthy();
	expect(screen.getByText('body')).toBeTruthy();
	expect(screen.queryByLabelText('Loading…', { hidden: true })).toBeNull();
});

test('the real card and its skeleton resolve to the same surface style', async () => {
	await render(
		<>
			<View testID="real">
				<Card />
			</View>
			<Card.Skeleton label="Load">{null}</Card.Skeleton>
		</>,
	);
	const real = screen.getByTestId('real').children[0] as unknown as { props: Record<string, unknown> };
	const skeleton = screen.getByLabelText('Load', { hidden: true });
	expect(flat(real.props.style)).toMatchObject({ backgroundColor: '#f2f2f2', borderRadius: 14 });
	expect(flat(skeleton.props.style)).toEqual(flat(real.props.style));
});
