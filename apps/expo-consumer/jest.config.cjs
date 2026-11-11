module.exports = {
	preset: 'jest-expo',
	globalSetup: './jest.global-setup.cjs',
	setupFiles: ['./jest.setup.js'],
	testMatch: ['**/__tests__/**/*.test.tsx'],
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-native-css|nativewind|@radandevist/radan-ui)',
	],
};
