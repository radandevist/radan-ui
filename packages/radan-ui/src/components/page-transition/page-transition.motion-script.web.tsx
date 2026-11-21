import { useLayoutEffect } from 'react';

import { applyStoredMotion, MOTION_SCRIPT } from './page-transition.motion';

/**
 * Put it in the document head: the inline script writes `<html data-motion>` before the first paint, and the layout
 * effect writes it again after a document swap (the root error page replaces <html> and empties its attributes).
 * `nonce` is the CSP nonce of the request. The browser strips the `nonce` attribute from the DOM, so the script
 * carries `suppressHydrationWarning` (and `<html>` needs it too: the script sets an attribute before hydration).
 */
export const MotionScript = ({ nonce }: { nonce?: string }) => {
	useLayoutEffect(applyStoredMotion, []);
	return <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />;
};
