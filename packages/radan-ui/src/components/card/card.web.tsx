import { cn } from '../../lib/cn';
import type { CardPartProps, CardProps } from './card.contract';
import { CardBodySkeleton, CardHeaderSkeleton, CardSkeleton } from './card.skeleton.web';
import { card, cardBody, cardHeader } from './card.variants';

const CardRoot = ({ className, children }: CardProps) => <div className={cn(card, className)}>{children}</div>;
const CardHeader = ({ className, children }: CardPartProps) => (
	<div className={cn(cardHeader, className)}>{children}</div>
);
const CardBody = ({ className, children }: CardPartProps) => <div className={cn(cardBody, className)}>{children}</div>;

/** `Card`, `Card.Header`, `Card.Body`; each part carries its skeleton (`Card.Skeleton`, `Card.Header.Skeleton`, …). */
export const Card = Object.assign(CardRoot, {
	Header: Object.assign(CardHeader, { Skeleton: CardHeaderSkeleton }),
	Body: Object.assign(CardBody, { Skeleton: CardBodySkeleton }),
	Skeleton: CardSkeleton,
});

export type { CardPartProps, CardProps, CardSkeletonProps } from './card.contract';
