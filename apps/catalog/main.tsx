/// <reference types="vite/client" />

import { type ComponentType, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './app.css';

// Every `pages/<name>.page.tsx` is a catalog page (default export = the page). Nothing to register: see CONTRIBUTING.md.
const pages = Object.fromEntries(
	Object.entries(import.meta.glob<{ default: ComponentType }>('./pages/*.page.tsx', { eager: true })).map(
		([path, module]) => [path.replace('./pages/', '').replace('.page.tsx', ''), module.default],
	),
);

const params = new URLSearchParams(location.search);
// ?theme=dark before first paint, so tests open any page in dark directly; ?page=<name> picks the page (default: tokens).
if (params.get('theme') === 'dark') {
	document.documentElement.classList.add('dark');
}
const name = params.get('page') ?? 'tokens';
const Page = pages[name];

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		{Page ? (
			<Page />
		) : (
			<ul className="p-6">
				{Object.keys(pages).map((page) => (
					<li key={page}>
						<a className="underline" href={`?page=${page}`}>
							{page}
						</a>
					</li>
				))}
			</ul>
		)}
	</StrictMode>,
);
