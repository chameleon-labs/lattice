# Card

`Card` — the **raised** elevation role as a component.

```tsx
<Card>
  <h3>example.com/checkout</h3>
  <p>Score 72</p>
</Card>
```

All three elevation signals ship together because each covers a case the others
cannot: the shadow reads on light and is effectively absent on dark, the surface
step reads on dark, and the border is the only one that survives
`forced-colors`.

**A card never takes `role="button"`.** An interactive card exposes its action
through a real control inside it — a link whose hit area is stretched in CSS —
which keeps one accessible name and one tab stop instead of two.

**Class:** `.lat-card`.
