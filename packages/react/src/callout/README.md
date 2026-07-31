# Callout

`Callout` — an inline, persistent message carrying severity.

```tsx
<Callout tone="danger" title="Rate limited">
  Try again in a minute, or sign up to raise the limit.
</Callout>
```

| Prop | Values | Default |
|---|---|---|
| `tone` | `neutral` \| `accent` \| `success` \| `warning` \| `danger` | `neutral` |
| `title` | `string` | — |
| `live` | `polite` \| `assertive` | **absent** |

**No live role by default**, and that is the point. A callout rendered on page
load with `role="alert"` is announced immediately and out of context, which is
worse than silence. Pass `live` only when the callout appears in response to
something the user did.

`children` is required in the type, for the same reason as `Badge`.

**Classes:** `.lat-callout`, `.lat-callout__title`, `.lat-callout__body`, with
`data-tone`. The tone edge is a border rather than a background stripe, so it
survives `forced-colors`.
