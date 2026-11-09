# One appear/disappear animation (HARD)

Everything that appears or disappears goes through the library's `Collapse` — never a hand-rolled transition; a single
element changing shape morphs, and both respect reduced motion.

- **Appear/disappear = `<Collapse open axis="x|y">`.** A button in a toolbar uses `axis="x"`, a block in a page
  `axis="y"`: two steps on a `0fr ↔ 1fr` grid track, `inert` + `aria-hidden` while closed. No bespoke
  `width`/`height`/`rotate`/`opacity` transition anywhere else.
- **One element changing shape = a morph**, not a cross-fade into a copy: the parts both states share stay mounted
  and glide to their new place and size; what belongs to one state appears or fades under them; the element's height
  follows its content so the elements below slide instead of jumping.
- **Sequence**: closing, what leaves fades out first and fast, then the shape glides; opening, the shape glides at
  once, then what arrives fades in — a moving part never crosses text that is on screen.
- **Two curves, defined once** (`ease-enter`, `ease-exit`) and a small duration scale (colour ≈ 120ms, layout ≈
  240ms); reuse them, never invent a curve or duration of your own.
- **Entrances play once on mount** (`rise`, `pop`, `fade`), cascaded with `--i` (~45ms apart); never on re-render.
- **A route change is a page transition**, not an element appearing: use the view-transition path where supported,
  and never with reduced motion.
- **`prefers-reduced-motion` is respected inside the primitives** — entrances become plain fades, morphs don't move.
  Callers don't re-implement it.
- Reuse the existing motion utilities before writing a new keyframe or transition.

Related: [mobile-native.md](./mobile-native.md), [visual-consistency.md](./visual-consistency.md).
