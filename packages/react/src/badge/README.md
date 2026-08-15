# Badge

`Badge` — a tinted chip, always mono uppercase: a 10-15% colour fill, a
20-25% border, and `--lat-text` on top, set at 10px with wide tracking.

```tsx
<Badge variant="danger">down 12</Badge>
<Badge variant="serious"><AlertTriangleIcon /> serious</Badge>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `default` \| `primary` \| `info` \| `success` \| `danger` \| `warning` \| `critical` \| `serious` \| `moderate` \| `minor` | `default` |

`children` is **required in the type**. That is the guarantee rather than a
convenience: a badge signalling by colour alone cannot be written.

**Every variant is the same construction.** Only two custom properties change
between them — `--_tint` and `--_tint-border` — so adding a variant is two
declarations, never a new shape. `default` uses the neutral `--lat-wash` /
`--lat-border` pair rather than a chromatic scale, so an unstyled badge reads
as neutral, not as an accidental colour.

## The label is not tinted

It was, and it did not survive measurement. A scale's solid used as text on its
own tint measured **2.01-3.98:1** across the light variants at 10px, where 4.5:1
applies — `moderate` worst at 2.01. The tints are alpha colours, so the
effective background is whatever surface the badge lands on, and those figures
are over `--lat-bg`.

Every label now reads `--lat-text`. The variant is still carried, by the tint
and the border, and the text says the thing — which is why `children` is
required. Darkening the scales instead would have meant inventing colour: there
is one anchor per scale per mode, and this package pins its palette rather than
generating it. See [#96](https://github.com/chameleon-labs/lattice/issues/96).

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
