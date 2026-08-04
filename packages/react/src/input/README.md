# Input

`Input` — the styled control alone, for a field whose label lives elsewhere: a
search box in a toolbar, or a cell editor inside a table. When the label belongs
to the control, use [`TextField`](../text-field/README.md) instead.

```tsx
<Input aria-label="Search" size="sm" />
<Input invalid />
```

| Prop | Values | Default |
|---|---|---|
| `size` | `sm` \| `md` \| `lg` | `md` |
| `invalid` | `boolean` — sets `aria-invalid` | `false` |

The native `size` attribute is deliberately not accepted. HTML's `size` means
visible character width, which is a different idea from this system's size
scale, and it would win silently at the DOM level.

Meridian sets every field value in the mono face — a token name, a URL, an
identifier — because the things its fields hold are all of that kind. Focus
sets both a matching border and a ring, since the border alone is not enough
contrast against `--lat-field-bg` for everyone who relies on it.

**Class:** `.lat-input`. `data-size` is still written to the DOM for callers
that key off it, but Meridian's field styling does not vary by size.
