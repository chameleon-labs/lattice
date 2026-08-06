# Progress

`Progress` — a determinate progress bar.

```tsx
<Progress label="Audit progress" value={50} />
<Progress label="Audit progress" value={4} max={6} valueText="Step 4 of 6" />
```

| Prop | Values | Default |
|---|---|---|
| `value` | `number`, clamped into `0…max` | — |
| `max` | `number` | `100` |
| `label` | `string` | — (required) |
| `valueText` | `string` | — |

Two things a caller would otherwise have to remember.

**It cannot render unlabelled.** `label` is required. A bare `role="progressbar"`
announces a percentage with no indication of what is progressing, which is worse
than silence: the user hears "43 percent" and has no way to find out of what.

**The percentage is computed once.** A fill whose width comes from one
calculation while `aria-valuenow` comes from another is a bar that eventually
disagrees with itself — and the disagreement is invisible to the person relying
on the announced number. Both read the same clamped value. Out-of-range input is
clamped rather than trusted, and a non-positive `max` falls back to 100 instead
of dividing by zero.

`valueText` is worth setting whenever the underlying unit means more than the
proportion. For step-based work it usually does: "step 4 of 6" is more use than
"67%".

## There is no indeterminate variant

Deliberately. An indeterminate bar is, in every implementation, an animation
that runs until the work finishes, and `tests/css-contract.test.ts` forbids
exactly that — nothing `infinite`, nothing over five seconds. The reduced-motion
contract is not suspended because the moving thing is a progress bar; that
contract is why `Skeleton` and `Toast` are still unbuilt.

Work whose extent is genuinely unknown wants a component that names the step it
is on instead of implying a proportion it cannot compute. That is an
application-level pattern rather than a system one — tabstop's audit log is the
only instance so far — so it is not shipped here.

The fill is drawn with `transform: scaleX()` rather than `inline-size`, so the
browser composites the change instead of laying out again on every tick. The
transform itself is a position, not motion — the *transition* is what moves, and
that is inside a `prefers-reduced-motion: no-preference` query.

**Classes:** `.lat-progress`; `.lat-progress__fill`.
