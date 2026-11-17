// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
/** One 1 px line (`border-input`, the pale token; never a second ring), the tinted surface, 16 px text below md (iOS does not zoom a 16 px field), 14 px from md. */
export const inputField =
	'h-9 w-full min-w-0 rounded-control border border-input bg-input/50 px-3 py-1 text-base text-input-foreground md:text-sm';

/** The skeleton bone: the field's silhouette. */
export const inputSkeletonBone = 'h-9 w-full rounded-control';
