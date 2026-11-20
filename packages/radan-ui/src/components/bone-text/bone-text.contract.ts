import type { BoneLineSize } from '../bone-line/bone-line.contract';

/** A paragraph: `lines` bones, the last one shorter. */
export type BoneTextProps = { lines?: number; size?: BoneLineSize; className?: string };
