/// <reference types="vite/client" />

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './app.css';
import { TokensPage } from './tokens-page';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<TokensPage />
	</StrictMode>,
);
