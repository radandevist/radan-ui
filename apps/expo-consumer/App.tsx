import { Button } from '@radandevist/radan-ui/button';
import { vars } from 'nativewind';
import { ScrollView, Text, View } from 'react-native';

import './global.css';

// Every row is a proof point of the spike; the bundle is inspected by scripts/ (no device here).
export default function App() {
	return (
		<ScrollView className="flex-1 bg-background">
			<View className="gap-4 p-4">
				<Text className="text-foreground">light, default theme</Text>
				<Button>Default</Button>
				<Button variant="outline">Outline (shadow-raised-control)</Button>
				<Button className="rounded-card" size="sm">
					rounded-card
				</Button>
				<View className="dark gap-4 bg-background p-4">
					<Text className="text-foreground">dark (.dark wrapper)</Text>
					<Button>Dark default</Button>
					<Button variant="outline">Dark outline</Button>
				</View>
				<View style={vars({ '--radan-ui-primary': '#ff0000' })} className="gap-4">
					<Text className="text-foreground">runtime override of --radan-ui-primary</Text>
					<Button>Overridden</Button>
				</View>
			</View>
		</ScrollView>
	);
}
