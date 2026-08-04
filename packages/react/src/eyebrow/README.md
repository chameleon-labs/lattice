# Eyebrow

`Eyebrow` — the uppercase 10px mono label at 0.2em tracking.

```tsx
<Eyebrow>Coverage</Eyebrow>
<Eyebrow rule>Section</Eyebrow>
```

| Prop | Values | Default |
|---|---|---|
| `rule` | `boolean` | `false` |

It exists so that tracking value has exactly one home. It appears on every
section head, panel header and column in both Meridian demos — the same
construction `Card`'s `__label` and `Table`'s `__header` already carry — and a
value repeated across a dozen stylesheets is a value that drifts.

`rule` draws the short leading hairline the landing page's section labels use,
as a sibling `<span>` rather than a border on the component itself, so it
never fights a header row's own `border-bottom`.

**Classes:** `.lat-eyebrow`; `.lat-eyebrow__rule`, `.lat-eyebrow__text`.
