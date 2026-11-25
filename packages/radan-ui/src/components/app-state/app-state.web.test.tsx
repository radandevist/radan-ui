// @vitest-environment jsdom
import { readFileSync } from 'node:fs';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test } from 'vitest';

import type { StateTone } from './app-state.contract';
import { Link, WifiOff, compositions } from './app-state.parity.fixtures';
import { errorState, stateTones } from './app-state.variants';
import { EmptyState, ErrorState } from './app-state.web';

afterEach(cleanup);

test('the error root keeps its two divs and splits the props: layout outside, the announced block inside', () => {
	const { container } = render(
		<ErrorState className="extra" style={{ color: 'rgb(1, 2, 3)' }} aria-live="polite" data-extra="yes">
			<ErrorState.Title>Lost</ErrorState.Title>
		</ErrorState>,
	);
	const outer = container.querySelector<HTMLElement>('div')!;
	const inner = outer.querySelector<HTMLElement>('div')!;
	expect(outer.className).toBe(`${errorState.root} extra`);
	expect(outer.style.color).toBe('rgb(1, 2, 3)');
	expect(outer.getAttribute('role')).toBeNull();
	expect(outer.getAttribute('aria-live')).toBeNull();
	expect(outer.getAttribute('data-extra')).toBeNull();
	expect(inner.getAttribute('role')).toBe('alert');
	expect(inner.getAttribute('aria-live')).toBe('polite');
	expect(inner.getAttribute('data-extra')).toBe('yes');
	expect(inner.className).toBe(errorState.block);
	expect(outer.childElementCount).toBe(1);
	cleanup();
	render(<ErrorState role="status" />);
	expect(screen.getByRole('status').className).toBe(errorState.block);
});

test('every error tone applies its status pair; the box and the glyph keep the source size, tilt and 1.75 stroke', () => {
	const tones: StateTone[] = ['info', 'neutral', 'warning', 'danger'];
	for (const tone of tones) {
		const { container, unmount } = render(<ErrorState.Pictogram icon={WifiOff} tone={tone} />);
		const box = container.querySelector<HTMLElement>('div')!;
		const [ring, innerRing, tile] = box.children;
		expect(box.className).toBe(errorState.pictogram);
		expect(box.getAttribute('aria-hidden')).toBe('true');
		expect(ring!.className).toBe(`${errorState.ring} ${stateTones[tone].halo}`);
		expect(innerRing!.className).toBe(`${errorState.innerRing} ${stateTones[tone].halo}`);
		expect(tile!.className).toBe(`${errorState.tile} ${stateTones[tone].tile}`);
		const glyph = box.querySelector('svg')!;
		expect(glyph.getAttribute('class')).toBe('tabler-icon tabler-icon-wifi-off size-8 rotate-[6deg]');
		expect(glyph.getAttribute('stroke-width')).toBe('1.75');
		expect(glyph.getAttribute('stroke')).toBe('currentColor');
		unmount();
	}
	const { container } = render(<ErrorState.Pictogram icon={WifiOff} />);
	expect(container.firstElementChild!.innerHTML).toContain('--radan-ui-status-open-background');
});

test('the error title is an h1, forwards its ref and tabIndex, and render picks another element with the look', () => {
	const ref = createRef<HTMLHeadingElement>();
	render(
		<ErrorState.Title ref={ref} tabIndex={-1}>
			Lost
		</ErrorState.Title>,
	);
	const title = screen.getByRole('heading', { level: 1 });
	expect(title.className).toBe(errorState.title);
	expect(ref.current).toBe(title);
	expect(title.tabIndex).toBe(-1);
	cleanup();
	render(<ErrorState.Title render={<h2 />}>Lost</ErrorState.Title>);
	expect(screen.getByRole('heading', { level: 2 }).className).toBe(errorState.title);
});

test('the description, the action cluster and the disclosure carry their classes and the verbatim chevron', () => {
	render(
		<ErrorState>
			<ErrorState.Description>Why</ErrorState.Description>
			<ErrorState.Actions>
				<span>buttons</span>
			</ErrorState.Actions>
			<ErrorState.Details label="Technical details">Error: load_timeout</ErrorState.Details>
		</ErrorState>,
	);
	expect(screen.getByText('Why').className).toBe(errorState.description);
	expect(screen.getByText('buttons').parentElement!.className).toBe(errorState.actions);
	const summary = screen.getByText('Technical details').closest('summary')!;
	const details = summary.closest('details')!;
	expect(summary.className).toBe(errorState.summary);
	expect(details.className).toBe(errorState.details);
	const pre = details.querySelector('pre')!;
	expect(pre.className).toBe(errorState.pre);
	expect(pre.textContent).toBe('Error: load_timeout');
	const chevron = summary.querySelector('svg')!;
	expect(Object.fromEntries([...chevron.attributes].map(({ name, value }) => [name, value]))).toEqual({
		xmlns: 'http://www.w3.org/2000/svg',
		width: '24',
		height: '24',
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		'stroke-width': '2',
		'stroke-linecap': 'round',
		'stroke-linejoin': 'round',
		class: errorState.chevron,
		'aria-hidden': 'true',
	});
	expect(chevron.querySelector('path')!.getAttribute('d')).toBe('M6 9l6 6l6 -6');
	fireEvent.click(summary);
	expect(details.open).toBe(true);
});

test('the empty size context reaches every part, and the root is the only wrapper', () => {
	const { container } = render(
		<EmptyState size="compact">
			<EmptyState.Pictogram icon={Link} />
			<EmptyState.Title>All attached</EmptyState.Title>
			<EmptyState.Text>Every parcel</EmptyState.Text>
			<EmptyState.Actions>
				<span>action</span>
			</EmptyState.Actions>
		</EmptyState>,
	);
	const root = container.querySelector<HTMLElement>('div')!;
	expect(root.className).toBe('flex flex-col items-center px-4 text-center py-8');
	const box = root.querySelector<HTMLElement>('div')!;
	expect(box.className).toBe('relative size-24');
	expect(box.children[1]!.className).toBe('absolute rounded-full border bg-card opacity-90 inset-3');
	expect(box.children[2]!.className).toBe(
		'absolute top-1/2 left-1/2 flex -translate-1/2 -rotate-6 items-center justify-center border bg-background shadow-[var(--radan-ui-effect-raised-control)] size-11 rounded-control',
	);
	expect(box.querySelector('svg')!.getAttribute('class')).toBe(
		'tabler-icon tabler-icon-link rotate-6 size-6 text-muted-foreground',
	);
	expect(box.querySelector('svg')!.getAttribute('stroke-width')).toBe('1.5');
	expect(root.children[1]!.className).toBe('mt-3 font-semibold text-balance text-base');
	expect(root.children[2]!.className).toBe(
		'mt-1.5 max-w-[380px] text-pretty text-muted-foreground text-[13.5px] leading-normal',
	);
	expect(root.children[3]!.className).toBe('mt-5 flex flex-wrap justify-center gap-2');
});

test('the default empty keeps the 120 px scale; the title is an h2, the text a p, and className replaces the muted tint', () => {
	render(
		<EmptyState>
			<EmptyState.Pictogram icon={Link} />
			<EmptyState.Title>Nothing</EmptyState.Title>
			<EmptyState.Text>No parcel</EmptyState.Text>
		</EmptyState>,
	);
	const box = document.querySelector('[aria-hidden="true"]')!;
	expect(box.className).toBe('relative size-[120px]');
	expect(box.querySelector('svg')!.getAttribute('class')).toBe(
		'tabler-icon tabler-icon-link rotate-6 size-7 text-muted-foreground',
	);
	// `cn` drops the source's `leading-[1.3]` when `text-lg` follows it: the fixtures show the shipped DOM, so it goes too.
	expect(screen.getByRole('heading', { level: 2 }).className).toBe('mt-3 font-semibold text-balance text-lg');
	expect(screen.getByText('No parcel').tagName).toBe('P');
	cleanup();
	render(
		<EmptyState>
			<EmptyState.Pictogram icon={Link} className="text-status-success" />
			<EmptyState.Title render={<div />}>Success</EmptyState.Title>
		</EmptyState>,
	);
	const glyph = document.querySelector('[aria-hidden="true"] svg')!;
	expect(glyph.getAttribute('class')).toBe('tabler-icon tabler-icon-link rotate-6 size-7 text-status-success');
	expect(screen.getByText('Success').tagName).toBe('DIV');
});

const FIXTURES = 'src/components/app-state/__fixtures__/shopkart/block';
const fixture = (name: string) => readFileSync(`${FIXTURES}/${name}.html`, 'utf8');

// Parsed and re-serialised: the normalised outerHTML the spec compares. Only the attribute order is sorted — it carries
// no meaning, and Base UI's `render` puts the link's `href` where ShopKartOS's installed version put it last. Elements,
// attribute values (class order included), text and nesting are compared as rendered.
const normalise = (html: string) => {
	const holder = document.createElement('div');
	holder.innerHTML = html.trim();
	for (const element of holder.querySelectorAll('*')) {
		const attributes = [...element.attributes]
			.map(({ name, value }) => ({ name, value }))
			.sort((a, b) => a.name.localeCompare(b.name));
		for (const { name } of attributes) {
			element.removeAttribute(name);
		}
		for (const { name, value } of attributes) {
			element.setAttribute(name, value);
		}
	}
	return holder.innerHTML;
};

// The exact eight ShopKartOS compositions: a missing key silently shrinks the parity suite, so it is locked here.
const compositionNames = [
	'error-info',
	'error-neutral',
	'error-warning',
	'error-danger',
	'error-status',
	'error-details',
	'empty-default',
	'empty-compact',
] as const;

test('the parity fixtures cover exactly the eight block compositions', () => {
	expect(Object.keys(compositions).sort()).toEqual([...compositionNames].sort());
});

test.each(Object.entries(compositions))('parity: %s renders the ShopKartOS block fixture', (name, element) => {
	expect(normalise(renderToStaticMarkup(element))).toBe(normalise(fixture(name)));
});
