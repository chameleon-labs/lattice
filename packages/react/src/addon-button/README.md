# AddonButton

`AddonButton` — an icon-only control for the inside of a field. A password
reveal, a clear-search. [`Button`](../button/README.md) is the wrong shape here:
it draws a box, and this sits inside one.

```tsx
<TextField
  label="Password"
  type={visible ? 'text' : 'password'}
  addonEnd={
    <AddonButton label={visible ? 'Hide password' : 'Show password'} onClick={toggle}>
      {visible ? <EyeOffIcon /> : <EyeIcon />}
    </AddonButton>
  }
/>
```

| Prop | Values | Default |
|---|---|---|
| `label` | `string` — **required**, becomes `aria-label` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `children` | the icon | — |

**Why it exists:** three things an icon button inside a field has to get right,
each invisible when missed.

`label` is required, so the component **cannot render unlabelled**. An icon-only
button with no accessible name announces nothing, and the icon is the whole
content — there is no text to fall back on. `Progress` makes the same demand for
the same reason.

**`type` is fixed to `"button"`.** A bare `<button>` defaults to `submit`, and
this control is nearly always inside a form, so a reveal toggle would submit the
sign-in it sits in.

**The pressable box is floored at 24px** on both axes — WCAG 2.2 §2.5.8's
minimum — however small the icon is. Without the floor the target would be
whatever the icon happened to measure, which is 12px at `sm`.

`size` is `Input`'s scale and sets the icon size; the box floor is what keeps
`sm` pressable. An `<svg>` child is sized by the component at `1em` and inherits
`currentColor`, so an icon needs no dimensions of its own.

Disabled uses Ariakit's `accessibleWhenDisabled`, on by default: the control
keeps its tab stop and its name and carries `aria-disabled`, rather than
vanishing from the tab order so a keyboard user never learns it is there.

**No colour axis.** Lattice's fields show one addon treatment, and this system
does not offer a knob the design never turns — the same call `Button` made when
it dropped its tone axis.

**A toggle should change its name, not only its icon.** The password story swaps
both. `aria-pressed` is deliberately not offered: combined with a label that
already changes, it announces the state twice.

**Class:** `.lat-addon-button`, with `data-size`.
