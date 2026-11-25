import { useRender } from '@base-ui/react/use-render';
import { createContext, type ComponentProps, type ReactNode, useContext } from 'react';

import { cn } from '../../lib/cn';
import type {
	EmptyStateActionsProps,
	EmptyStatePictogramProps,
	EmptyStateProps,
	EmptyStateSize,
	EmptyStateTextProps,
	ErrorStateActionsProps,
	ErrorStateDescriptionProps,
	ErrorStateDetailsProps,
	ErrorStatePictogramProps,
	ErrorStateProps,
} from './app-state.contract';
import { emptyState, emptyStateFixed, emptyStateParts, errorState, stateTones } from './app-state.variants';

// The only state the parts share: the empty size. It renders nothing; every part reads it where it is.
const EmptyStateSizeContext = createContext<EmptyStateSize>('default');
const useEmptyStateSize = () => useContext(EmptyStateSizeContext);

const ErrorStateRoot = ({ role = 'alert', className, style, children, ...props }: ErrorStateProps) => (
	<div className={cn(errorState.root, className)} style={style}>
		<div role={role} {...props} className={errorState.block}>
			{children}
		</div>
	</div>
);

/** The decorative pictogram: the glyph on a tinted tile, inside two fading rings of the same tint. */
const ErrorStatePictogram = ({ icon: IconComponent, tone = 'info', className }: ErrorStatePictogramProps) => {
	const { halo, tile } = stateTones[tone];
	return (
		<div aria-hidden className={cn(errorState.pictogram, className)}>
			<span className={cn(errorState.ring, halo)} />
			<span className={cn(errorState.innerRing, halo)} />
			<span className={cn(errorState.tile, tile)}>
				<IconComponent className={errorState.glyph} stroke={1.75} />
			</span>
		</div>
	);
};

export type ErrorStateTitleWebProps = {
	children: ReactNode;
	className?: string;
	render?: useRender.ComponentProps<'h1'>['render'];
} & Omit<ComponentProps<'h1'>, 'children' | 'className' | 'render'>;

/** `h1` by default; `render={<h2 />}` (or a `div`) keeps the look for an inline caller. */
const ErrorStateTitle = ({ className, children, render, ...props }: ErrorStateTitleWebProps) =>
	useRender({
		defaultTagName: 'h1',
		render,
		props: { ...props, className: cn(errorState.title, className), children },
	});

const ErrorStateDescription = ({ className, ...props }: ErrorStateDescriptionProps) => (
	<p className={cn(errorState.description, className)} {...props} />
);

const ErrorStateActions = ({ className, ...props }: ErrorStateActionsProps) => (
	<div className={cn(errorState.actions, className)} {...props} />
);

/** The native disclosure: the caller's label and raw content, the Tabler chevron copied inline (no icon package). */
const ErrorStateDetails = ({ label, children, className }: ErrorStateDetailsProps) => (
	<details className={cn(errorState.details, className)}>
		<summary className={errorState.summary}>
			{label}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				className={errorState.chevron}
				aria-hidden="true"
			>
				<path d="M6 9l6 6l6 -6" />
			</svg>
		</summary>
		<pre className={errorState.pre}>{children}</pre>
	</details>
);

const EmptyStateRoot = ({ size = 'default', className, children, ...props }: EmptyStateProps) => (
	<EmptyStateSizeContext.Provider value={size}>
		<div className={cn(emptyState({ size }), className)} {...props}>
			{children}
		</div>
	</EmptyStateSizeContext.Provider>
);

const EmptyStatePictogram = ({ icon: IconComponent, className }: EmptyStatePictogramProps) => {
	const size = useEmptyStateSize();
	return (
		<div aria-hidden className={cn(emptyStateFixed.pictogram, emptyStateParts.pictogram[size])}>
			<span className={emptyStateFixed.ring} />
			<span className={cn(emptyStateFixed.innerRing, emptyStateParts.innerRing[size])} />
			<span className={cn(emptyStateFixed.tile, emptyStateParts.tile[size])}>
				<IconComponent
					className={cn(emptyStateFixed.glyph, emptyStateParts.glyph[size], className ?? emptyStateFixed.glyphTint)}
					stroke={1.5}
				/>
			</span>
		</div>
	);
};

export type EmptyStateTitleWebProps = {
	children: ReactNode;
	className?: string;
	render?: useRender.ComponentProps<'h2'>['render'];
} & Omit<ComponentProps<'h2'>, 'children' | 'className' | 'render'>;

/** `h2` by default; `render={<div />}` lets an inline caller keep the look without a heading. */
const EmptyStateTitle = ({ className, children, render, ...props }: EmptyStateTitleWebProps) => {
	const size = useEmptyStateSize();
	return useRender({
		defaultTagName: 'h2',
		render,
		props: {
			...props,
			className: cn(emptyStateFixed.title, emptyStateParts.title[size], className),
			children,
		},
	});
};

const EmptyStateText = ({ className, ...props }: EmptyStateTextProps) => {
	const size = useEmptyStateSize();
	return <p className={cn(emptyStateFixed.text, emptyStateParts.text[size], className)} {...props} />;
};

const EmptyStateActions = ({ className, ...props }: EmptyStateActionsProps) => (
	<div className={cn(emptyStateFixed.actions, className)} {...props} />
);

/**
 * The error, not-found or offline screen, ShopKartOS's as-is: pictogram, title, one sentence, actions and, when the
 * caller composes it, the raw error folded under its own label. Text, icon, tone and actions are the caller's: no
 * i18n, no router, no fetch.
 */
export const ErrorState = Object.assign(ErrorStateRoot, {
	Pictogram: ErrorStatePictogram,
	Title: ErrorStateTitle,
	Description: ErrorStateDescription,
	Actions: ErrorStateActions,
	Details: ErrorStateDetails,
});

/**
 * The empty state, ShopKartOS's as-is: two faint rings around a tilted tile, a title, a line of text and the actions.
 * `size="compact"` is the sober in-card variant (96 px rings, a 16 px title).
 */
export const EmptyState = Object.assign(EmptyStateRoot, {
	Pictogram: EmptyStatePictogram,
	Title: EmptyStateTitle,
	Text: EmptyStateText,
	Actions: EmptyStateActions,
});

export type {
	EmptyStateActionsProps,
	EmptyStatePictogramProps,
	EmptyStateProps,
	EmptyStateSize,
	EmptyStateTextProps,
	ErrorStateActionsProps,
	ErrorStateDescriptionProps,
	ErrorStateDetailsProps,
	ErrorStatePictogramProps,
	ErrorStateProps,
	StateIcon,
	StateTone,
} from './app-state.contract';
