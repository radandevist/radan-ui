# Composition: build UI from small parts through `children`, never config flags (HARD)

A component with parts is a **compound component** (`Card.Header`, `Card.Body`, `Skeleton.Card.Body`) — the caller
composes the parts it needs — never a component with a growing list of boolean or config props.

- **No boolean-prop soup.** `hasThumb`, `showPill`, `variant="card|row|tile"` flags mean several components are
  wearing one coat: split it, or make it a compound so the shape comes from the composition itself.
- **Props describe data that changes the shape, not which parts exist.** A layout prop the real element also has
  (`size`, `lines`, `cells`, `open`) is fine; a prop that only switches a chunk of markup on and off is not.
- **Shared state flows through context**: the parent owns it, the parts read it through the nearest provider — not
  prop-drilled into every part.
- **Compose, don't fork.** A page assembles library parts; it never re-draws a component with its own markup (the
  skeleton library is the reference example: [skeletons.md](./skeletons.md)).

Short example — the shape is what you compose:

```tsx
<Card>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Pill tone={status} />
	</Card.Header>
	<Card.Body>{body}</Card.Body>
</Card>
```

…never `<Card hasHeader showPill lines={2} />`.
