import { useRender } from '@base-ui/react/use-render';

import { cn } from '../../lib/cn';
import type { CardPartProps, CardProps } from './card.contract';
import {
	CardBodySkeleton,
	CardHeaderSkeleton,
	CardHeadingSkeleton,
	CardIconSkeleton,
	CardLabelSkeleton,
	CardSkeleton,
} from './card.skeleton.web';
import { card, cardBody, cardHeader, cardHeading, cardIcon, cardLabel } from './card.variants';

const CardRoot = ({ className, children }: CardProps) => <div className={cn(card, className)}>{children}</div>;
const CardHeader = ({ className, children }: CardPartProps) => (
	<div className={cn(cardHeader, className)}>{children}</div>
);
const CardHeading = ({ className, children }: CardPartProps) => (
	<div className={cn(cardHeading, 'text-muted-foreground', className)}>{children}</div>
);
// The svg inside fills the 14 px slot.
const CardIcon = ({ className, children }: CardPartProps) => (
	<span className={cn(cardIcon, 'flex [&_svg]:size-full', className)}>{children}</span>
);
/** A `span`; `render={<h2 />}` makes it a real heading with the same look (Base UI's `render`, as on `Button`). */
export type CardLabelWebProps = CardPartProps & { render?: useRender.ComponentProps<'span'>['render'] };
const CardLabel = ({ className, children, render }: CardLabelWebProps) =>
	useRender({ defaultTagName: 'span', render, props: { className: cn(cardLabel, 'truncate', className), children } });
const CardBody = ({ className, children }: CardPartProps) => <div className={cn(cardBody, className)}>{children}</div>;

/**
 * The double-wall card: `Card` is the frame, `Card.Header` its row (`Card.Header.Heading` = `Card.Header.Icon` +
 * `Card.Header.Label`, then any action), `Card.Body` the inner panel. Each part carries its skeleton.
 */
export const Card = Object.assign(CardRoot, {
	Header: Object.assign(CardHeader, {
		Skeleton: CardHeaderSkeleton,
		Heading: Object.assign(CardHeading, { Skeleton: CardHeadingSkeleton }),
		Icon: Object.assign(CardIcon, { Skeleton: CardIconSkeleton }),
		Label: Object.assign(CardLabel, { Skeleton: CardLabelSkeleton }),
	}),
	Body: Object.assign(CardBody, { Skeleton: CardBodySkeleton }),
	Skeleton: CardSkeleton,
});

export type {
	CardIconSkeletonProps,
	CardLabelSkeletonProps,
	CardPartProps,
	CardProps,
	CardSkeletonProps,
} from './card.contract';
