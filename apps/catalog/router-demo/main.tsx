/// <reference types="vite/client" />

import { MotionScript } from '@radandevist/radan-ui/page-transition';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '../app.css';
import '@radandevist/radan-ui/page-transition.css';
import { getRouter } from './router';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MotionScript />
		<RouterProvider router={getRouter()} />
	</StrictMode>,
);
