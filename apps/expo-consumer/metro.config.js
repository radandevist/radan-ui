const { getDefaultConfig } = require('expo/metro-config');
const { withRadanUi } = require('@radandevist/radan-ui/metro');

module.exports = withRadanUi(getDefaultConfig(__dirname));
