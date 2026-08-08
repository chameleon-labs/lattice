# Input

`Input` — the styled control alone, for a field whose label lives elsewhere: a
search box in a toolbar, or a cell editor inside a table. When the label belongs
to the control, use [`TextField`](../text-field/README.md) instead.

```tsx
<Input aria-label="Search" />
<Input size="lg" aria-label="Page URL" />
<Input invalid />
```

| Prop | Values | Default |
|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `invalid` | `boolean` — sets `aria-invalid` | `false` |

`size` is **Button's scale**, not a second one: at every step a field and a
button render the same height — 30, 38 and 46px — so the two sit level in a
row without either being nudged. A hero pairing a URL field with its submit
button is the case that needs it, and that pairing is what
`tests/browser/field.spec.ts` measures. Only the block padding changes; the
type stays put, because a field's value is the same value at any size.

The scale shadows the native `size` attribute (HTML's "visible character
width"), which is why the prop type omits it. Set an explicit width in CSS
instead — the native attribute never sized a field predictably anyway, being
measured in average character widths of the rendered face.

Lattice sets every field value in the mono face — a token name, a URL, an
identifier — because the things its fields hold are all of that kind. Focus
sets both a matching border and a ring, since the border alone is not enough
contrast against `--lat-field-bg` for everyone who relies on it.

An invalid field (`aria-invalid="true"`) sets its border to
`--lat-danger-solid`; focusing an invalid field keeps that colour on both the
border and the ring, so the danger cue never disappears at the moment someone
is correcting it. Colour is not the only cue — `TextField` renders the error
message itself in the `meta` role beneath the control.

**Class:** `.lat-input`.
