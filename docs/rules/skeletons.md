# Skeletons: one library, one bone per real element, never a grey block (HARD)

Every loading skeleton is composed from the one skeleton library and mirrors its real content one bone per element —
a card skeleton is the real card surface with bones inside it, never a filled grey rectangle.

- **One skeleton library.** It owns every bone (`bg-foreground/10` fill + one pulse from the primitive). No file
  outside the library imports the base skeleton primitive or defines its own bone: no local `Bar`, no hand-rolled
  `animate-pulse` block. Contrast is fixed once in the primitive — never re-styled per skeleton to "fix" it.
- **A skeleton beside each component.** Every display component that can load exports its own skeleton — same file or
  a sibling `<name>-skeleton.tsx` — taking the same layout props where they change its shape. When the component
  changes, its skeleton sits next to it and changes with it. A screen skeleton only **composes** component skeletons;
  it never re-draws a component.
- **One bone per real element**, same shape, size, position and spacing, inside the same surfaces, with the same
  paddings and gaps, on mobile **and** desktop: icon, thumbnail, title line, sub-line, pill, amount, chevron,
  divider, button, tab, input, checkbox, column header… A bone may never stand for a whole card or section.
- **Never a grey block.** The surface classes come from the real component (`bg-card`, ring, radius, padding); only
  its content is missing.
- **A11y comes with it**: the region is `aria-busy`, a visually hidden status line says "Loading…", and every bone is
  `aria-hidden` (the primitive does that — never pass text or roles to a bone).

The library is a Compound Component — parts composed through `children`, no boolean props:

```tsx
<Skeleton.Card>
	<Skeleton.Card.Header>
		<Skeleton.Line size="sm" width="w-16" />
		<Skeleton.Pill width="w-14" />
	</Skeleton.Card.Header>
	<Skeleton.Card.Body>
		<Skeleton.Text lines={2} size="xs" />
	</Skeleton.Card.Body>
</Skeleton.Card>
```

A page skeleton then only composes component skeletons (header, tabs, N × component skeleton).
