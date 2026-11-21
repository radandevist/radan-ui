import { cva } from 'class-variance-authority';

// ShopKartOS's phone top bar, class for class. Classes valid on both platforms: no hover: here (they live in the web file).

/** The header: the title always at its compact size; below md sticky, transparent, over the backdrop layer. */
export const phoneTopBarVariants = cva(
	'flex shrink-0 items-center gap-2 bg-background p-4 max-md:sticky max-md:top-0 max-md:z-[45] max-md:border-b max-md:border-transparent max-md:bg-transparent max-md:px-4 max-md:py-2.5',
);

/** Below md the header is two layers: this backdrop (its background and border, z 30) and the buttons and title above it (z 45), pulled under the header by its own height (65 px). */
export const phoneTopBarBackdropVariants = cva(
	'sticky top-0 z-30 -mb-[65px] h-[65px] shrink-0 border-b border-transparent bg-background transition-[border-color] duration-200 data-scrolled:border-border md:hidden',
);

/** The navigation toggle: a 44 px target, below md only, invisible while a page declares a back (`data-page-back`). */
export const phoneTopBarMenuVariants = cva(
	'-ml-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground md:hidden max-md:in-[body:has([data-page-back])]:invisible',
);

/** The back arrow: fixed top left over the bar below md, leading the title from md. */
export const phoneTopBarBackVariants = cva(
	'flex shrink-0 items-center justify-center text-muted-foreground max-md:fixed max-md:top-2.5 max-md:left-3 max-md:z-[46] max-md:size-11 max-md:rounded-lg max-md:text-foreground',
);

/** The title: truncated with an ellipsis, 20 px semibold below md within `--header-title-width` (the app defines it). */
export const phoneTopBarTitleVariants = cva(
	'truncate font-medium max-md:max-w-(--header-title-width) max-md:text-[20px] max-md:leading-normal max-md:font-semibold max-md:tracking-tight',
);

/** The right-hand controls. */
export const phoneTopBarActionsVariants = cva('ml-auto flex items-center gap-2');

export const phoneTopBarSkeletonVariants = cva('flex items-center gap-2 p-4 max-md:px-4 max-md:py-2.5');
