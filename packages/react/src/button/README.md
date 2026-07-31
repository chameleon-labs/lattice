# Button

`Button` — the reference implementation of this package's styling, focus and
motion contracts, and the trigger every overlay needs.

```tsx
<Button variant="solid" tone="danger" size="lg">Remove page</Button>
<Button render={<a href="/pages" />}>Pages</Button>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `solid` \| `soft` \| `ghost` | `soft` |
| `size` | `sm` \| `md` \| `lg` | `md` |
| `tone` | `accent` \| `neutral` \| `danger` | `accent` |

Everything Ariakit's `Button` accepts passes through, including `render`, which
swaps the element and narrows the props to that element's.

**Class:** `.lat-button`, with `data-variant`, `data-size`, `data-tone`.

Tone sets private `--_*` properties that the variant rules read, so the variant
rules stay tone-agnostic. Each tone reads its own family's `on-solid` — white
clears 4.5:1 on the accent fill and misses it on every other scale.

Under `prefers-reduced-motion: reduce` the press keeps its colour change and
loses its 1px travel.
