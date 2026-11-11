// Metro config helper for React Native / Expo apps (Node side, no React): the Metro options the library needs.
// inlineVariables: false keeps every --radan-ui-* variable overridable at runtime; inlineRem: 16 matches the web.
const loadNativewind = () => {
	try {
		return require('nativewind/metro');
	} catch (error) {
		if (error?.code !== 'MODULE_NOT_FOUND') {
			throw error;
		}
		throw new Error(
			'@radandevist/radan-ui/metro needs nativewind >= 5 and react-native-css installed in your app: ' +
				'`npm i nativewind@^5 react-native-css`.',
			{ cause: error },
		);
	}
};

const withRadanUi = (config, options = {}) =>
	loadNativewind().withNativewind(config, { inlineVariables: false, inlineRem: 16, ...options });

module.exports = { withRadanUi };
