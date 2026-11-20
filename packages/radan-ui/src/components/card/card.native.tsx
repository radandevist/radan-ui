import { View } from 'react-native';

import { cn } from '../../lib/cn';
import type { CardPartProps, CardProps } from './card.contract';
import { CardBodySkeleton, CardHeaderSkeleton, CardSkeleton } from './card.skeleton.native';
import { card, cardBody, cardHeader } from './card.variants';

const CardRoot = ({ className, children }: CardProps) => <View className={cn(card, className)}>{children}</View>;
const CardHeader = ({ className, children }: CardPartProps) => (
	<View className={cn(cardHeader, className)}>{children}</View>
);
const CardBody = ({ className, children }: CardPartProps) => (
	<View className={cn(cardBody, className)}>{children}</View>
);

/** `Card`, `Card.Header`, `Card.Body`; each part carries its skeleton (`Card.Skeleton`, `Card.Header.Skeleton`, …). */
export const Card = Object.assign(CardRoot, {
	Header: Object.assign(CardHeader, { Skeleton: CardHeaderSkeleton }),
	Body: Object.assign(CardBody, { Skeleton: CardBodySkeleton }),
	Skeleton: CardSkeleton,
});

export type { CardPartProps, CardProps, CardSkeletonProps } from './card.contract';
