# Badge

`Badge` — the tinted triple, always mono uppercase: a 10-15% colour fill, a
20-25% border, and full-strength text, set at 10px with wide tracking.

```tsx
<Badge variant="danger">down 12</Badge>
<Badge variant="serious"><AlertTriangleIcon /> serious</Badge>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `default` \| `primary` \| `info` \| `success` \| `danger` \| `warning` \| `critical` \| `serious` \| `moderate` \| `minor` | `default` |

`children` is **required in the type**. That is the guarantee rather than a
convenience: a badge signalling by colour alone cannot be written.

**Every variant is the same construction.** Only three custom properties
change between them — `--_tint`, `--_tint-border`, `--_text` — so adding a
variant is three declarations, never a new shape. `default` uses the neutral
`--lat-wash` / `--lat-border` / `--lat-text-subtle` triple rather than a
chromatic scale, so an unstyled badge reads as neutral, not as an accidental
colour.

The last four variants are the severity ramp, as used by the landing page's
`ImpactBadge` (an axe impact string threaded straight into `variant`, plus a
required icon and label — not a separate component). They are their own
variants rather than a mapping onto the six chromatic ones above: the
severity ramp has its own tint tokens (`--lat-severity-{level}-tint` /
`-tint-border`) because there is no chromatic scale at `moderate`'s hue (84,
amber) to borrow — the nearest candidate, `info`, is blue (hue 232), and
substituting it would break both the ramp's hue ordering and the lightness
ordering the severity tokens are built on as the safety net for when hue
fails. `minor` carries no colour of its own and reads identically to
`default`, but keeps its own name so a caller labelling an impact level never
has to know that its lowest level happens to be neutral.

**Colour never carries severity alone**: pair every severity badge with both
an icon and a text label — these hues are hardest to distinguish under
protanopia and deuteranopia. See the `Impact` story.

**Class:** `.lat-badge`, with `data-variant`.
