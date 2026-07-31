# Switch

`Switch` — a binary control whose state is a **position**, not a colour.

```tsx
<label htmlFor="monitoring">Monitoring</label>
<Switch id="monitoring" defaultChecked />
```

Takes everything Ariakit's `Checkbox` accepts.

A native checkbox carrying `role="switch"` rather than a button with an explicit
`aria-checked`. The native element keeps label association through `htmlFor`,
form participation, and the browser's own mapping of `checked` into the
accessibility tree — all of which a button would have to re-implement.

**Class:** `.lat-switch`. The thumb is a `::before` positioned with a *static*
transform, so the state signal survives `prefers-reduced-motion: reduce`; only
the travel between positions is gated.
