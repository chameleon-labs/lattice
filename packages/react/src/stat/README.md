# Stat

`Stat` — value, label and sub-label, with the numeric role's tabular figures
applied to the value.

```tsx
<Stat value="84" label="Components" sub="production-ready" />
```

| Prop | Values | Default |
|---|---|---|
| `value` | `ReactNode` | — |
| `label` | `string` | — |
| `sub` | `string` (optional) | — |

`font-variant-numeric: var(--lat-text-numeric-font-variant-numeric)` on
`.lat-stat__value` is the whole reason the `numeric` role exists: tabular
figures keep every digit the same width, so a row of stats does not jitter
sideways as its values change. See the `Row` story.

`.lat-stat__label` is the eyebrow construction — the same one `Card`'s
`__label`, `Table`'s `__header` and `Eyebrow` itself use. `.lat-stat__sub`
takes the `meta` role at `--lat-text-subtle`.

**Classes:** `.lat-stat`, `.lat-stat__value`, `.lat-stat__label`,
`.lat-stat__sub`.
