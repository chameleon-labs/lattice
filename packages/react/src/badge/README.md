# Badge

`Badge` — the tinted triple, always mono uppercase: a 10-15% colour fill, a
20-25% border, and full-strength text, set at 10px with wide tracking.

```tsx
<Badge variant="danger">down 12</Badge>
<Badge variant="warning"><AlertTriangleIcon /> serious</Badge>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `default` \| `primary` \| `info` \| `success` \| `danger` \| `warning` | `default` |

`children` is **required in the type**. That is the guarantee rather than a
convenience: a badge signalling by colour alone cannot be written.

**Every variant is the same construction.** Only three custom properties
change between them — `--_tint`, `--_tint-border`, `--_text` — so adding a
variant is three declarations, never a new shape. `default` uses the neutral
`--lat-wash` / `--lat-border` / `--lat-text-subtle` triple rather than a
chromatic scale, so an unstyled badge reads as neutral, not as an accidental
colour.

The landing page's `ImpactBadge` is this component with a severity variant
plus a required icon and label — it is not a separate component. Colour never
carries severity alone: pair every severity badge with both an icon and a
text label, since the danger/warning/info hues are the hardest to
distinguish by colour alone under protanopia and deuteranopia. See the
`Impact` story for the four-level mapping (critical/serious/moderate/minor
onto danger/warning/info/default).

**Class:** `.lat-badge`, with `data-variant`.
