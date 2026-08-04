# Input

`Input` — the styled control alone, for a field whose label lives elsewhere: a
search box in a toolbar, or a cell editor inside a table. When the label belongs
to the control, use [`TextField`](../text-field/README.md) instead.

```tsx
<Input aria-label="Search" />
<Input invalid />
```

| Prop | Values | Default |
|---|---|---|
| `invalid` | `boolean` — sets `aria-invalid` | `false` |

There is no `size` prop. Fields render at one size everywhere in
the source design — no variant of a field is shown larger or smaller than
another — so this system doesn't offer a knob the design never turns, the
same call Button made when it dropped the tone axis. The native `size`
attribute (HTML's "visible character width") passes through untouched, since
nothing here shadows it any more.

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
