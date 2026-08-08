# TextField

`TextField` — an input with its label, description and error wired together.

```tsx
<TextField
  label="Page URL"
  description="We audit the page at this address."
  error="That address can't be audited."
/>
```

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | **Required.** Rendered as a real `<label>` |
| `description` | `string` | Optional hint |
| `error` | `string` | Optional; sets `aria-invalid` when present |

Everything `Input` accepts passes through, except `aria-describedby` and
`aria-invalid`, which this component owns. That includes
[`size`](../input/README.md), so a labelled field takes the same `sm`/`md`/`lg`
scale — and the same height — as the button beside it.

`size` also lands on `.lat-text-field` as `data-size`, so the outer box states
which step it is on rather than leaving a caller to read it off the control
inside.

The label steps with the control — 9, 10 and 11px — so a small field is not
topped by a full-size eyebrow. `md` is the eyebrow role's own step, so a field
that never asks for a size is unchanged. Font size is the only property that
moves: the role's leading is unitless and follows on its own, and the tracking,
weight, face and casing are the eyebrow construction at every step. The
description and error do not scale.

**Why it exists:** the wiring is not hard, it is *invisible*. A missing
`aria-describedby` looks identical in review to a present one. `aria-describedby`
lists exactly the ids that were rendered — description then error — and is
**absent** when there is neither, because an empty one points assistive
technology at nothing.

The error carries no live role. One present on first render would announce out
of context; see [`Callout`](../callout/README.md) for the same reasoning.

**Classes:** `.lat-text-field`, `.lat-text-field__label`,
`.lat-text-field__description`, `.lat-text-field__error`. The label is an
uppercase mono eyebrow; the error takes the `meta` role in
`--lat-danger-solid`.
