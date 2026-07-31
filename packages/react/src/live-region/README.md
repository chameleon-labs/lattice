# LiveRegion

`LiveRegion` — an announcement that does not repeat itself.

```tsx
<LiveRegion message={`${phase}… this usually takes about 30 seconds`} />
```

| Prop | Values | Default |
|---|---|---|
| `message` | `string` | — |
| `politeness` | `polite` \| `assertive` | `polite` |

Holds the last announced string and leaves the DOM untouched when the new one
matches. #19 names the trap: a live region updated on every poll is unusable,
which is itself the kind of bug this product exists to find.

The region renders **empty from the first paint** rather than appearing with the
first message. A live region inserted at announcement time is not reliably read
— assistive technology has to be observing the container before its content
changes.

Visible by default and unstyled beyond typography, because tabstop's progress
text is both the announcement and the thing a sighted user reads. For an
announcement with no visual presence, wrap it in
[`VisuallyHidden`](../visually-hidden/README.md).

`assertive` interrupts whatever the user is currently hearing. It is a last
resort.

**Class:** `.lat-live-region`.
