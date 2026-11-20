export type BoneLineSize = 'xs' | 'sm' | 'md' | 'lg';

/** One text line: `size` sets the height, `width` is a Tailwind width class (`w-16`, `w-2/3`; default `w-full`). */
export type BoneLineProps = { size?: BoneLineSize; width?: string; className?: string };
