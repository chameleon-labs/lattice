# Eyebrow

`Eyebrow` — the uppercase 10px mono label at 0.2em tracking.

```tsx
<Eyebrow>Coverage</Eyebrow>
<Eyebrow rule>Section</Eyebrow>
<Eyebrow align="center">Early access — free</Eyebrow>
```

| Prop | Values | Default |
|---|---|---|
| `rule` | `boolean` | `false` |
| `tone` | `'subtle'` \| `'accent'` | `'subtle'` |
| `align` | `'start'` \| `'center'` | `'start'` |

It exists so that tracking value has exactly one home. It appears on every
section head, panel header and column in both Meridian demos — the same
construction `Card`'s `__label` and `Table`'s `__header` already carry — and a
value repeated across a dozen stylesheets is a value that drifts.

`rule` draws the short leading hairline the landing page's section labels use,
as a sibling `<span>` rather than a border on the component itself, so it
never fights a header row's own `border-bottom`.

`align="center"` centres the eyebrow inside a `text-align: center` ancestor —
the landing page's CTA kicker is the one instance. `.lat-eyebrow` is
`display: flex` (for the `rule` variant's icon-and-text layout), and a flex
container sizes to its own `justify-content` rather than inheriting an
ancestor's `text-align`, so the page cannot reach the centred state on its
own without reading past the component's internals. A prop is the honest
fix here: a centred eyebrow is a normal thing to want, not a one-off.

**Classes:** `.lat-eyebrow`; `.lat-eyebrow__rule`, `.lat-eyebrow__text`.
