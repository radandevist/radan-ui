import { Text, View } from 'react-native';

import { cn } from '../../lib/cn';
import type { CardPartProps, CardProps } from './card.contract';
import {
	CardBodySkeleton,
	CardHeaderSkeleton,
	CardHeadingSkeleton,
	CardIconSkeleton,
	CardLabelSkeleton,
	CardSkeleton,
} from './card.skeleton.native';
import { card, cardBody, cardHeader, cardHeading, cardIcon, cardLabel } from './card.variants';

const CardRoot = ({ className, children }: CardProps) => <View className={cn(card, className)}>{children}</View>;
const CardHeader = ({ className, children }: CardPartProps) => (
	<View className={cn(cardHeader, className)}>{children}</View>
);
const CardHeading = ({ className, children }: CardPartProps) => (
	<View className={cn(cardHeading, className)}>{children}</View>
);
const CardIcon = ({ className, children }: CardPartProps) => (
	<View className={cn(cardIcon, className)}>{children}</View>
);
const CardLabel = ({ className, children }: CardPartProps) => (
	<Text numberOfLines={1} className={cn(cardLabel, 'shrink', className)}>
		{children}
	</Text>
);
const CardBody = ({ className, children }: CardPartProps) => (
	<View className={cn(cardBody, className)}>{children}</View>
);

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
