# Skeletons: one library, one bone per real element, never a grey block (HARD)

Every loading skeleton is composed from the library's bones and its components' own skeletons, and mirrors its real content one bone per element —
a card skeleton is the real card surface with bones inside it, never a filled grey rectangle.

- **One bone.** `Bone` owns the fill (`bg-foreground/10` + one pulse, defined once in `bone.variants.ts`); `BoneLine`, `BonePill`,
  `BoneText` and `BoneRegion` are the generic shapes, each imported on its own (`@radandevist/radan-ui/bone-line`, …).
  There is no root `Skeleton` object: it would not tree-shake. No file
  outside the library defines its own bone: no local `Bar`, no hand-rolled
  `animate-pulse` block. Contrast is fixed once in the primitive — never re-styled per skeleton to "fix" it.
- **A skeleton owned by each component.** Every display component that can load carries its own skeleton as a static
  member — `Card.Skeleton`, `Card.Header.Skeleton`, `Button.Skeleton`, `Input.Skeleton`, `Toast.Skeleton`,
  `PageBack.Skeleton` — defined in a sibling `<name>.skeleton.*.tsx`, taking the same layout props where they change its shape. When the component
  changes, its skeleton sits next to it and changes with it. A screen skeleton only **composes** component skeletons;
  it never re-draws a component.
- **One bone per real element**, same shape, size, position and spacing, inside the same surfaces, with the same
  paddings and gaps, on mobile **and** desktop: icon, thumbnail, title line, sub-line, pill, amount, chevron,
  divider, button, tab, input, checkbox, column header… A bone may never stand for a whole card or section.
- **Never a grey block.** The surface classes come from the real component (`bg-card`, ring, radius, padding); only
  its content is missing.
- **A11y comes with it**: the region is `aria-busy`, a visually hidden status line says "Loading…", and every bone is
  `aria-hidden` (the primitive does that — never pass text or roles to a bone).

The skeleton of a compound component is compound too — parts composed through `children`, no boolean props:

```tsx
<Card.Skeleton>
	<Card.Header.Skeleton>
		<BoneLine size="sm" width="w-16" />
		<BonePill width="w-14" />
	</Card.Header.Skeleton>
	<Card.Body.Skeleton>
		<BoneText lines={2} size="xs" />
	</Card.Body.Skeleton>
</Card.Skeleton>
```

A page skeleton then only composes component skeletons (header, tabs, N × component skeleton).
