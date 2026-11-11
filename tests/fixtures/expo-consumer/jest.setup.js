// Stand-in for react-native-css' Metro resolver (globalClassNamePolyfill): every `react-native` import, including the
// ones inside prebuilt node_modules code, gets the className-aware components; react-native-css itself sees the real module.
jest.mock('react-native', () => {
	const actual = jest.requireActual('react-native');
	const wrapped = [
		'ActivityIndicator',
		'Button',
		'FlatList',
		'Image',
		'ImageBackground',
		'KeyboardAvoidingView',
		'Pressable',
		'ScrollView',
		'Switch',
		'Text',
		'TextInput',
		'TouchableHighlight',
		'TouchableOpacity',
		'TouchableWithoutFeedback',
		'View',
		'VirtualizedList',
	];
	const css = {};
	jest.doMock('react-native', () => actual); // while react-native-css loads, `react-native` is the real one
	const components = jest.requireActual('react-native-css/components');
	for (const name of wrapped) css[name] = components[name]; // eager: the getters are lazy requires
	return new Proxy(actual, { get: (target, key) => (key in css ? css[key] : target[key]) });
});
