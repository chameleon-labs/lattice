# Badge

`Badge` — a status marker that is never only a colour.

```tsx
<Badge tone="danger">down 12</Badge>
<Badge tone={violation.impact}>{violation.impact}</Badge>
```

| Prop | Values | Default |
|---|---|---|
| `tone` | `neutral` \| `accent` \| `success` \| `warning` \| `danger` \| `critical` \| `serious` \| `moderate` \| `minor` | `neutral` |

`children` is **required in the type**. That is the guarantee rather than a
convenience: a badge signalling by colour alone cannot be written.

The last four tones are the severity ramp, so an axe impact string can be passed
straight through instead of maintaining a mapping that could drift.

**Severity is a mark contract, not a text one.** The token system guarantees each
severity level clears 3:1 against its surface — WCAG's *non-text* threshold — so
those colours appear as the border while the label keeps `--lat-text`, which is
contract-checked against the surface.

**Class:** `.lat-badge`, with `data-tone`.
