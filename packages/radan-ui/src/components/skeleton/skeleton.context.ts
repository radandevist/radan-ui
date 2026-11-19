import { createContext } from 'react';

/** True inside a region: a nested card or root adds no second "Loading…" status nor `aria-busy`. */
export const SkeletonRegionContext = createContext(false);
