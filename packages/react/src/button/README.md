# Button

`Button` — the reference implementation of this package's styling, focus and
motion contracts, and the trigger every overlay needs.

```tsx
<Button variant="destructive" size="lg">Remove page</Button>
<Button render={<a href="/pages" />}>Pages</Button>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` \| `destructive` \| `link` | `secondary` |
| `size` | `sm` \| `md` \| `lg` | `md` |

Everything Ariakit's `Button` accepts passes through, including `render`, which
swaps the element and narrows the props to that element's.

**Class:** `.lat-button`, with `data-variant`, `data-size`.

Meridian names five buttons, and this component offers exactly five — the
previous `variant × tone` matrix (`solid|soft|ghost` × `accent|neutral|danger`)
is gone, and `ButtonTone` is removed entirely. A system that follows a design
strictly cannot also offer combinations the design never drew: a neutral button
is `secondary`, a dangerous one is `destructive`.

`destructive` is a *tinted* button — danger at 10% fill, 20% border, and
full-strength danger text — not a solid red fill. That is what the design
shows, and it is what stops a destructive action from outweighing the primary
one on the same row.

Under `prefers-reduced-motion: reduce` there is nothing to strip: colour and
opacity feedback is unconditional, and neither is what causes vestibular harm.
