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

Lattice names five buttons, and this component offers exactly five — the
previous `variant × tone` matrix (`solid|soft|ghost` × `accent|neutral|danger`)
is gone, and `ButtonTone` is removed entirely. A system that follows a design
strictly cannot also offer combinations the design never drew: a neutral button
is `secondary`, a dangerous one is `destructive`.

`link` carries **no underline**, so at rest it is told apart from the text
around it by colour alone. That makes it a **standalone** control — a nav item,
a footer action, a control on its own line — not something to drop inside a
paragraph, where WCAG 1.4.1 expects a link in a block of text to carry a second
cue. The axe sweep will not catch that misuse: `link-in-text-block` looks at
`<a>`, and this variant renders a `<button>` unless `render` says otherwise.

The rule sets `text-decoration: none` rather than leaving the property unset,
because `render={<a href="…" />}` is a normal way to use this variant and a
browser underlines a bare anchor by default.

`destructive` is a *tinted* button — danger at 10% fill, 20% border, and
full-strength danger text — not a solid red fill. That is what the design
shows, and it is what stops a destructive action from outweighing the primary
one on the same row.

Under `prefers-reduced-motion: reduce` there is nothing to strip: colour and
opacity feedback is unconditional, and neither is what causes vestibular harm.

The disabled look keys on both `:disabled` and `[aria-disabled='true']`.
Ariakit renders the latter — leaving the element natively enabled — when
`accessibleWhenDisabled` keeps a disabled control focusable, which is the
accessible default: a control dropped from the tab order can't announce why
it's unavailable. Styling only `:disabled` would leave that control looking
and behaving enabled while assistive technology is told the opposite.
