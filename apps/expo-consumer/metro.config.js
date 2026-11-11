const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

// inlineVariables: false keeps every --radan-ui-* variable overridable at runtime (the default inlines single-definition
// variables at build time and deletes them); inlineRem: 16 matches the web (default 14).
module.exports = withNativewind(getDefaultConfig(__dirname), { inlineVariables: false, inlineRem: 16 });
