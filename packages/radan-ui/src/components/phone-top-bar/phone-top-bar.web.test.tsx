// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useContext, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageTitleContext, PageTitleProvider, PhoneTopBar, shownPageTitle } from './phone-top-bar.web';

afterEach(cleanup);

// The reference: ShopKartOS's phone bar (apps/web/src/components/topbar.tsx, page-back.tsx, origin/main), its class
// strings copied verbatim, with Tabler's own svg markup for the two icons. The block must render the same DOM.
const SK_HEADER =
	'flex shrink-0 items-center gap-2 bg-background p-4 max-md:sticky max-md:top-0 max-md:z-[45] max-md:border-b max-md:border-transparent max-md:bg-transparent max-md:px-4 max-md:py-2.5';
const SK_BACKDROP =
	'sticky top-0 z-30 -mb-[65px] h-[65px] shrink-0 border-b border-transparent bg-background transition-[border-color] duration-200 data-scrolled:border-border md:hidden';
const SK_HIDDEN_BY_PAGE_BACK = 'max-md:in-[body:has([data-page-back])]:invisible';
const SK_TOGGLE = `-ml-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden ${SK_HIDDEN_BY_PAGE_BACK}`;
const SK_BACK =
	'flex shrink-0 items-center justify-center text-muted-foreground hover:text-foreground max-md:fixed max-md:top-2.5 max-md:left-3 max-md:z-[46] max-md:size-11 max-md:rounded-lg max-md:text-foreground max-md:hover:bg-muted';
const SK_TITLE =
	'truncate font-medium max-md:max-w-(--header-title-width) max-md:text-[20px] max-md:leading-normal max-md:font-semibold max-md:tracking-tight';

const TablerSvg = ({ name, size, children }: { name: string; size: string; children: ReactNode }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={`tabler-icon tabler-icon-${name} ${size}`}
	>
		{children}
	</svg>
);

const Reference = ({ scrolled = false, back = true }: { scrolled?: boolean; back?: boolean }) => (
	<>
		<div aria-hidden data-scrolled={scrolled || undefined} className={SK_BACKDROP} />
		<header className={SK_HEADER}>
			<button
				type="button"
				aria-label="Open navigation"
				aria-haspopup="dialog"
				aria-expanded={false}
				className={SK_TOGGLE}
			>
				<TablerSvg name="align-left" size="size-6">
					<path d="M4 6l16 0" />
					<path d="M4 12l10 0" />
					<path d="M4 18l14 0" />
				</TablerSvg>
			</button>
			{back && (
				<button type="button" aria-label="Back" data-page-back className={SK_BACK}>
					<TablerSvg name="arrow-left" size="size-6 md:size-5">
						<path d="M5 12l14 0" />
						<path d="M5 12l6 6" />
						<path d="M5 12l6 -6" />
					</TablerSvg>
				</button>
			)}
			<span className={SK_TITLE}>
				<span className="max-md:hidden">Pickups</span>
				<span className="md:hidden">P-4</span>
			</span>
			<div className="ml-auto flex items-center gap-2">
				<div className="contents" />
				<button type="button">Bell</button>
			</div>
		</header>
	</>
);

const Block = ({ back = true }: { back?: boolean }) => (
	<PhoneTopBar>
		<PhoneTopBar.Menu label="Open navigation" onPress={() => {}} expanded={false} />
		{back && <PhoneTopBar.Back label="Back" onBack={() => {}} />}
		<PhoneTopBar.Title path="/pickups/P-4" fallback="P-4" pageName="Pickups" />
		<PhoneTopBar.Actions>
			<button type="button">Bell</button>
		</PhoneTopBar.Actions>
	</PhoneTopBar>
);

type DomNode = { tag: string; attrs: [string, string | string[]][]; children: (DomNode | string)[] };

/** The DOM as a tree: tag, attributes (class as a sorted set), children. The icons' `tabler-icon*` marker classes and `aria-hidden` are the only allowed difference. */
const tree = (html: string): DomNode[] => {
	const root = document.createElement('div');
	root.innerHTML = html;
	const walk = (node: Element): DomNode => ({
		tag: node.tagName.toLowerCase(),
		attrs: [...node.attributes]
			.filter((attr) => !(node.tagName.toLowerCase() === 'svg' && attr.name === 'aria-hidden'))
			.map((attr): [string, string | string[]] => [
				attr.name,
				attr.name === 'class'
					? attr.value
							.split(/\s+/)
							.filter((token) => token && !token.startsWith('tabler-icon'))
							.sort()
					: attr.value,
			])
			.sort(([a], [b]) => a.localeCompare(b)),
		children: [...node.childNodes].map((child) => (child instanceof Element ? walk(child) : (child.textContent ?? ''))),
	});
	return [...root.children].map(walk);
};

describe('parity with ShopKartOS`s phone bar', () => {
	it('renders the same DOM with a back arrow (classes as sets, structure, attributes)', () => {
		expect(tree(renderToStaticMarkup(<Block />))).toEqual(tree(renderToStaticMarkup(<Reference />)));
	});

	it('renders the same DOM without a back arrow', () => {
		expect(tree(renderToStaticMarkup(<Block back={false} />))).toEqual(
			tree(renderToStaticMarkup(<Reference back={false} />)),
		);
	});

	it('shows the same border on the backdrop once the page scrolled', () => {
		render(<Block />);
		const backdrop = () => document.querySelector('[aria-hidden="true"]:not(svg)');
		expect(backdrop()?.hasAttribute('data-scrolled')).toBe(false);
		Object.defineProperty(window, 'scrollY', { configurable: true, value: 5 });
		act(() => void window.dispatchEvent(new Event('scroll')));
		expect(backdrop()?.hasAttribute('data-scrolled')).toBe(true);
		Object.defineProperty(window, 'scrollY', { configurable: true, value: 4 });
		act(() => void window.dispatchEvent(new Event('scroll')));
		expect(backdrop()?.hasAttribute('data-scrolled')).toBe(false);
	});
});

describe('the parts', () => {
	it('Menu is a button that reports the drawer state and presses', () => {
		const onPress = vi.fn<() => void>();
		render(<PhoneTopBar.Menu label="Open navigation" onPress={onPress} expanded />);
		const button = screen.getByRole('button', { name: 'Open navigation' });
		expect(button.getAttribute('aria-expanded')).toBe('true');
		fireEvent.click(button);
		expect(onPress).toHaveBeenCalledOnce();
	});

	it('Back goes once for two quick taps, and swallows a rejected navigation', async () => {
		const onBack = vi.fn<() => Promise<void>>(() => Promise.reject(new Error('nope')));
		const unhandled = vi.fn<() => void>();
		process.on('unhandledRejection', unhandled);
		render(<PhoneTopBar.Back label="Back" onBack={onBack} />);
		const button = screen.getByRole('button', { name: 'Back' });
		expect(button.hasAttribute('data-page-back')).toBe(true);
		fireEvent.click(button);
		fireEvent.click(button);
		await new Promise((resolve) => setTimeout(resolve, 0));
		process.off('unhandledRejection', unhandled);
		expect(onBack).toHaveBeenCalledOnce();
		expect(unhandled).not.toHaveBeenCalled();
	});

	it('Menu and Back take an app icon in place of the default one', () => {
		render(
			<>
				<PhoneTopBar.Menu label="m" onPress={() => {}}>
					<i data-testid="menu-icon" />
				</PhoneTopBar.Menu>
				<PhoneTopBar.Back label="b" onBack={() => {}}>
					<i data-testid="back-icon" />
				</PhoneTopBar.Back>
			</>,
		);
		expect(screen.getByTestId('menu-icon')).toBeTruthy();
		expect(screen.getByTestId('back-icon')).toBeTruthy();
		expect(document.querySelector('svg')).toBeNull();
	});

	it('Title shows the published title only for its own path, the fallback otherwise', () => {
		const published = { path: '/pickups/P-4', title: 'P-4 · Guangzhou' };
		expect(shownPageTitle(published, '/pickups/P-4', 'Pickups')).toBe('P-4 · Guangzhou');
		expect(shownPageTitle(published, '/items/new', 'Page')).toBe('Page');
		expect(shownPageTitle(undefined, '/items/new', 'Page')).toBe('Page');
		const withPublished = (path: string) =>
			renderToStaticMarkup(
				<PageTitleContext.Provider value={{ published, publish: () => {} }}>
					<PhoneTopBar.Title path={path} fallback="Page" />
				</PageTitleContext.Provider>,
			);
		expect(withPublished('/pickups/P-4')).toContain('P-4 · Guangzhou');
		expect(withPublished('/other')).not.toContain('P-4 · Guangzhou');
	});

	it('the provider hands a published title to the bar', () => {
		const Publisher = () => {
			const { publish } = useContext(PageTitleContext);
			return (
				<button type="button" onClick={() => publish({ path: '/a', title: 'Alpha' })}>
					publish
				</button>
			);
		};
		render(
			<PageTitleProvider>
				<PhoneTopBar.Title path="/a" fallback="Fallback" />
				<Publisher />
			</PageTitleProvider>,
		);
		expect(screen.getByText('Fallback')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'publish' }));
		expect(screen.getByText('Alpha')).toBeTruthy();
	});

	it('Action portals a page control into the bar`s slot, before the app`s controls', () => {
		render(
			<>
				<PhoneTopBar>
					<PhoneTopBar.Actions>
						<button type="button">Bell</button>
					</PhoneTopBar.Actions>
				</PhoneTopBar>
				<PhoneTopBar.Action>
					<button type="button">Filter</button>
				</PhoneTopBar.Action>
			</>,
		);
		const names = [...document.querySelectorAll('header button')].map((button) => button.textContent);
		expect(names).toEqual(['Filter', 'Bell']);
	});
});
