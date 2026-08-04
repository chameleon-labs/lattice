# Card

`Card` — a `--lat-bg-raised` surface with a hairline border. Every panel in
both demo pages is this construction: the surface, a `border-bottom`
header row carrying an uppercase mono eyebrow label, and a body.

```tsx
<Card>
  <CardHeader label="Audit" />
  <CardBody>
    <h3>example.com/checkout</h3>
    <p>Score 72</p>
  </CardBody>
</Card>
```

`CardHeader` takes `label` as a required prop, plus an optional `icon`
rendered before it and optional children rendered after it — a count or a
control on the right of the header row:

```tsx
<CardHeader label="Tokens">
  <Badge variant="info">12</Badge>
</CardHeader>
```

The hairline border is the edge that survives `forced-colors`, where the user
agent strips shadows and flattens surfaces to the system canvas — a `Card` is
`flat` by default (no shadow), and `data-elevation="floating"` is the escape
hatch for the rare instance that needs one, such as the Figma bundle's hero audit card:

```tsx
<Card data-elevation="floating">…</Card>
```

**A card never takes `role="button"`.** An interactive card exposes its action
through a real control inside it — a link whose hit area is stretched in CSS —
which keeps one accessible name and one tab stop instead of two.

**Classes:** `.lat-card`, `.lat-card__header`, `.lat-card__label`,
`.lat-card__body`.
