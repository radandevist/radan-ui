import { useState } from 'react';

import { component, DEFAULT_PREFIX, palette, semantic } from '../src/index';
import type { TokenValue } from '../src/theme/tokens';

const P = DEFAULT_PREFIX;
const v = (name: string) => `var(--${P}-${name})`;
const show = (t: TokenValue = '') => {
	if (typeof t === 'string') {
		return t;
	}
	return 'palette' in t ? `palette: ${t.palette}` : `semantic: ${t.semantic}`;
};
const isDark = () => document.documentElement.classList.contains('dark');

// Read ?theme=dark once, before first paint, so tests can open the page in dark directly.
if (new URLSearchParams(location.search).get('theme') === 'dark') {
	document.documentElement.classList.add('dark');
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="mb-10">
		<h2 className="mb-4 text-lg font-semibold">{title}</h2>
		{children}
	</section>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
	<div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">{children}</div>
);

const Swatch = ({ name }: { name: string }) => (
	<div className="rounded-card bg-card p-2 shadow-raised-control">
		<div className="h-12 rounded-control border border-border" style={{ background: v(name) }} />
		<div className="mt-2 text-xs font-medium break-all">{name}</div>
	</div>
);

const colorNames = Object.keys(semantic.light).filter((k) => k !== 'radius' && !k.startsWith('effect-'));
const effectNames = Object.keys(semantic.light).filter((k) => k.startsWith('effect-'));
const radii = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'card', 'control', 'popover', 'toast'] as const;
const radiusClass: Record<(typeof radii)[number], string> = {
	sm: 'rounded-sm',
	md: 'rounded-md',
	lg: 'rounded-lg',
	xl: 'rounded-xl',
	'2xl': 'rounded-2xl',
	'3xl': 'rounded-3xl',
	'4xl': 'rounded-4xl',
	card: 'rounded-card',
	control: 'rounded-control',
	popover: 'rounded-popover',
	toast: 'rounded-toast',
};
const tones = ['open', 'pending', 'resolved', 'closed', 'breached'] as const;

export const TokensPage = () => {
	const [dark, setDark] = useState(isDark);
	const toggle = () => {
		document.documentElement.classList.toggle('dark');
		setDark(isDark());
	};
	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<header className="mb-8 flex items-center justify-between gap-4">
				<h1 className="text-2xl font-bold">radan-ui tokens</h1>
				<button
					type="button"
					onClick={toggle}
					className="rounded-control bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-primary-raised"
				>
					{dark ? 'Light' : 'Dark'} theme
				</button>
			</header>
			<Section title="Palette">
				<Grid>
					{Object.keys(palette).map((n) => (
						<Swatch key={n} name={n} />
					))}
				</Grid>
			</Section>
			<Section title="Semantic">
				<Grid>
					{colorNames.map((n) => (
						<Swatch key={n} name={n} />
					))}
				</Grid>
			</Section>
			<Section title="Component">
				<Grid>
					{Object.keys(component).map((n) => (
						<div key={n} className="rounded-card bg-card p-2 shadow-raised-control">
							<div className="text-xs font-medium break-all">{n}</div>
							<div className="mt-1 text-xs text-muted-foreground break-all">{show(component[n])}</div>
						</div>
					))}
				</Grid>
			</Section>
			<Section title="Radius">
				<Grid>
					{radii.map((r) => (
						<div key={r} className="text-xs">
							<div className={`h-16 border border-border bg-card ${radiusClass[r]}`} />
							<div className="mt-1">{r}</div>
						</div>
					))}
				</Grid>
			</Section>
			<Section title="Shadows">
				<Grid>
					{effectNames.map((n) => (
						<div key={n} className="text-xs">
							<div className="h-16 rounded-card bg-popover-surface" style={{ boxShadow: v(n) }} />
							<div className="mt-2 break-all">{n}</div>
						</div>
					))}
				</Grid>
			</Section>
			<Section title="Status tones">
				<div className="flex flex-wrap gap-2">
					{tones.map((t) => (
						<span
							key={t}
							className="rounded-full border px-3 py-1 text-xs font-medium"
							style={{
								background: v(`status-${t}-background`),
								color: v(`status-${t}-foreground`),
								borderColor: v(`status-${t}-border`),
							}}
						>
							{t}
						</span>
					))}
				</div>
			</Section>
		</main>
	);
};
