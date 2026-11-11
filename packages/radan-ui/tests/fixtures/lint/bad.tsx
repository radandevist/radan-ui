export const Bad = () => {
	const value = (() => 1)();
	return <div>{value}</div>;
};
