# Callout

`Callout` — an inline, persistent message carrying severity.

```tsx
<Callout variant="danger" icon={<AlertOctagonIcon />} title="Rate limited">
  Try again in a minute, or sign up to raise the limit.
</Callout>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `info` \| `success` \| `warning` \| `danger` | **Required** |
| `icon` | `ReactNode` | **Required** |
| `title` | `string` | — |
| `live` | `polite` \| `assertive` | **absent** |

**No live role by default**, and that is the point. A callout rendered on page
load with `role="alert"` is announced immediately and out of context, which is
worse than silence. Pass `live` only when the callout appears in response to
something the user did.

`variant` shares Badge's vocabulary — `info` \| `success` \| `warning` \|
`danger` — minus the neutral tones Badge still carries. A callout is rendered
because something needs attention, so there is no neutral case left to
default to, which is why `variant` is required rather than optional.

`children` is required in the type, for the same reason as `Badge`. So is
`icon`: colour never carries meaning alone, the same rule Badge's severity
ramp follows, so a callout that signalled its variant by colour alone cannot
be written. The icon is rendered `aria-hidden`, since the title and body text
already carry everything a screen reader needs.

Every variant is the same tinted triple as `Badge` — `--_tint` /
`--_tint-border` / `--_text` — at panel scale, except that the icon alone
carries `--_text`'s accent colour. Title and body read at full-strength
`--lat-text`, not the accent colour, so a long message stays readable.

**Classes:** `.lat-callout`, `.lat-callout__icon`, `.lat-callout__content`,
`.lat-callout__title`, `.lat-callout__body`, with `data-variant`. The edge is
a real border rather than a box-shadow, so it survives `forced-colors`.
