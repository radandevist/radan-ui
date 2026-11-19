// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
/** ShopKartOS's field: 1 px `input` line plus the hairline ring, the `field` fill, 16 px text below md (iOS does not zoom a 16 px field), 14 px from md. */
export const inputField =
	'h-9 w-full min-w-0 rounded-input border border-input bg-field px-3 py-1 text-base text-foreground shadow-raised-control md:text-sm';

/** The skeleton bone: the field's silhouette. */
export const inputSkeletonBone = 'h-9 w-full rounded-input';
