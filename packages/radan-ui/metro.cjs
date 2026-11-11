// Metro config helper for React Native / Expo apps (Node side, no React): the Metro options the library needs.
// inlineVariables: false keeps every --radan-ui-* variable overridable at runtime; inlineRem: 16 matches the web.
const withRadanUi = (config, withNativewind = require('nativewind/metro').withNativewind) =>
	withNativewind(config, { inlineVariables: false, inlineRem: 16 });

module.exports = { withRadanUi };
