export const Bad = () => {
	const value = (() => 1)();
	return <div>{value}</div>;
};

export const applied = Reflect.apply(Math.max, null, [1]);
