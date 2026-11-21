// Classes valid on both platforms: no hover:, focus-visible: or color-mix() here (platform states live in each file).
// ShopKartOS's "double wall" card: a `bg-card` frame (1 px ring, 4 px inset) carrying the heading, and a bordered
// `bg-background` panel inside it carrying the content.
/** The frame: shared by the real card and its skeleton, so the skeleton is the real frame with bones inside it. `gap-0` cancels the region's own `gap-4`. */
export const card =
	'flex flex-col gap-0 overflow-hidden rounded-card bg-card p-1 text-sm text-card-foreground shadow-raised-control';
/** The heading row: the heading group on the left, anything else (a pill, a button) pushed to the right. */
export const cardHeader = 'flex flex-row items-center justify-between gap-3 px-3 pt-1 pb-2';
/** The heading group: icon then label, 6 px apart. */
export const cardHeading = 'flex min-w-0 flex-row items-center gap-1.5';
export const cardIcon = 'size-3.5 shrink-0';
/** The label: 12 px, medium, wide-tracked capitals. */
export const cardLabel = 'text-xs font-medium tracking-wide text-muted-foreground uppercase';
/** The inner panel. */
export const cardBody = 'rounded-card-body border border-border bg-background p-4';
