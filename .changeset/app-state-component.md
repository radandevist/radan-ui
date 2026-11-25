---
'@radandevist/radan-ui': minor
---

Add `@radandevist/radan-ui/app-state`, the shared error and empty screens, extracted from ShopKartOS with the same look and DOM.

`ErrorState` (pictogram, title, description, actions, technical details) and `EmptyState` (pictogram, title, text, actions, `size="default" | "compact"`) are compound components: compose the parts you need. Every text, icon, tone and action comes from the caller, so each app keeps its own translations and routing — no i18n, no router, no fetch, no icon dependency (the disclosure chevron is an inline SVG).

```tsx
import { EmptyState } from '@radandevist/radan-ui/app-state';

<EmptyState>
	<EmptyState.Pictogram icon={IconTruckDelivery} />
	<EmptyState.Title>{t('empty.forwarders')}</EmptyState.Title>
	<EmptyState.Text>{t('empty.forwarders-text')}</EmptyState.Text>
	<EmptyState.Actions>
		<Button className="h-11 md:h-9" onClick={openCreate}>
			{t('empty.add')}
		</Button>
	</EmptyState.Actions>
</EmptyState>;
```

Web only for now, and exempt from the skeleton files: a terminal state never loads. The visual-consistency rule now records the ShopKartOS aspect as the shared look (one family, three documented scales).
