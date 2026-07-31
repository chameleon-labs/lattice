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

**Class:** `.lat-input`, with `data-size`. The invalid state styles off
`[aria-invalid='true']`, so the visual and the announced state cannot diverge.
