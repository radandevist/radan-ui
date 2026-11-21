import { PageTitleProvider, PhoneTopBar } from '@radandevist/radan-ui/phone-top-bar';
import type { CSSProperties } from 'react';

// A catalog page: the bar as ShopKartOS draws it (sticky below md, the title at its compact size). The back arrow is
// not shown: its mere presence hides the menu button, page-wide (`data-page-back`), which is the rule, not a state.
// `--header-title-width` is the app's: the viewport less the bar's controls.
// SAFETY: a CSS custom property; React passes it through to the style attribute.
const appVars = { '--header-title-width': 'calc(100vw - 184px)' } as CSSProperties;

const Bell = () => (
	<span className="flex size-11 items-center justify-center rounded-full border border-border text-xs">3</span>
);

const PhoneTopBarPage = () => (
	<PageTitleProvider>
		<main style={appVars}>
			<PhoneTopBar>
				<PhoneTopBar.Menu label="Open navigation" onPress={() => {}} expanded={false} />
				<PhoneTopBar.Title path="/pickups/P-4" fallback="P-4 · Guangzhou Forwarder" pageName="Pickups" />
				<PhoneTopBar.Actions>
					<Bell />
				</PhoneTopBar.Actions>
			</PhoneTopBar>
			<div className="mx-auto max-w-3xl p-6">
				<h1 className="mb-6 text-xl font-semibold">Phone top bar</h1>
				<p className="mb-6 text-sm text-muted-foreground">
					Below md: the bar is sticky over a backdrop that takes its border once the page scrolls. From md the same
					header carries the app&apos;s own controls and the section&apos;s name.
				</p>
				<h2 className="mb-3 text-sm font-semibold text-muted-foreground">PhoneTopBar.Skeleton</h2>
				<PhoneTopBar.Skeleton />
				<div className="h-[120vh]" />
			</div>
		</main>
	</PageTitleProvider>
);

export default PhoneTopBarPage;
