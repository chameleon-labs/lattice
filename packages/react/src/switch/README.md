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

The track fills from `--lat-switch-track`, the one token Meridian declares
specifically for this control, and checked fills with `--lat-solid`. The
thumb sits on `--lat-bg-raised`. Track and thumb are the only two places in
this system where a pill (`--lat-radius-full`) is correct, because a switch is
a track rather than a panel.
