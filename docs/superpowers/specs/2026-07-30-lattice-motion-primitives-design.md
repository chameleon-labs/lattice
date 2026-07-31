# Lattice — motion primitives

**Date:** 2026-07-30
**Status:** approved design; written review pending
**Issue:** [#29 — Motion primitives and reduced-motion component contract](https://github.com/chameleon-labs/lattice/issues/29)

## Purpose

Add the theme-independent primitive motion layer approved in the broader
[spacing and motion specification](./2026-07-30-lattice-spacing-and-motion-design.md).
This slice publishes five durations and three easing curves in CSS and DTCG JSON,
then records the reduced-motion behavior that the future React component package
must implement.

The token package describes reusable values. It does not know which CSS
properties a component animates, so it cannot safely implement reduced-motion
behavior itself.

## Public contract

### Durations

| Name | Value | Intended use |
|---|---:|---|
| `instant` | `0ms` | State changes that must not animate |
| `fast` | `100ms` | Hover, focus and small colour changes |
| `base` | `150ms` | Most transitions |
| `slow` | `250ms` | Popovers, dropdowns and small overlays |
| `slower` | `400ms` | Dialogs, drawers and full-surface changes |

No duration may exceed `400ms`.

### Easings

| Name | CSS value | DTCG value | Intended use |
|---|---|---|---|
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | `[0.2, 0, 0, 1]` | Movement within the viewport |
| `entrance` | `cubic-bezier(0, 0, 0, 1)` | `[0, 0, 0, 1]` | Elements arriving |
| `exit` | `cubic-bezier(0.3, 0, 1, 1)` | `[0.3, 0, 1, 1]` | Elements leaving |

Every easing is a four-number tuple. Each component must be finite and within
the inclusive range `[0, 1]`.

### Published names and shapes

The two artefacts expose identical names and values:

| Family | CSS | DTCG |
|---|---|---|
| Duration | `--lat-duration-*` | `global.duration.*` |
| Easing | `--lat-easing-*` | `global.easing.*` |

Duration DTCG leaves use:

```json
{
  "$type": "duration",
  "$value": { "value": 150, "unit": "ms" }
}
```

Easing DTCG leaves use:

```json
{
  "$type": "cubicBezier",
  "$value": [0.2, 0, 0, 1]
}
```

There are exactly eight motion primitives: five durations and three easings.

## Architecture

Motion is a dedicated module rather than an extension of layout or a generic
primitive registry:

- `packages/tokens/config/motion.ts` owns the reviewed values and their literal
  names.
- `packages/tokens/generate/motion.ts` converts those values into CSS and DTCG
  representations and exports derived family and total counts.
- `packages/tokens/generate/emit.ts` composes motion into the existing global
  artefacts once.

The generated global CSS order is:

1. typography primitives;
2. layout primitives;
3. motion primitives;
4. semantic typography roles.

The DTCG `global` group spreads motion beside typography and layout primitives.
Neither CSS nor JSON duplicates motion values into light, dark or nested theme
scopes.

This separation is deliberate. Dimension, duration and cubic Bézier tokens have
different DTCG shapes, while a generic registry would erase useful type
boundaries before the repository has a second consumer that needs one.

## Reduced-motion boundary

The token package emits no `prefers-reduced-motion` media query and no global
transition reset. In particular, it must never publish a rule equivalent to:

```css
* {
  transition: none !important;
}
```

That reset removes opacity and colour feedback along with vestibular movement.
Only a component knows its transition properties, so the component layer owns
the behavior.

Issue #11 receives a dedicated **Reduced-motion acceptance criteria** checklist:

- under `prefers-reduced-motion: reduce`, remove transform animation and
  positional movement;
- preserve opacity and colour transition feedback;
- do not use a global transition reset;
- make continuous motion, or motion lasting longer than five seconds, pausable.

The checklist is separate from issue #11's open design questions so these
accessibility guarantees remain auditable acceptance criteria.

## Validation and testing

Implementation follows test-driven development:

1. Add direct contract tests and observe them fail before `config/motion.ts`
   exists.
2. Pin every public name and exact value.
3. Assert there are five durations, no duration exceeds `400ms`, and every
   duration is a finite non-negative number.
4. Assert every easing has exactly four finite components in `[0, 1]` and
   matches its approved tuple.
5. Add generator tests for exactly eight CSS declarations, exact DTCG types and
   shapes, `ms` units, CSS/DTCG parity and deterministic output.
6. Add integration tests proving motion is emitted once in the global CSS and
   DTCG groups and never under light or dark.
7. Validate the emitted JSON against the committed DTCG schema and update
   snapshots only after observing the expected failures.

Mutation checks temporarily:

- change an approved duration;
- raise a duration above `400ms`;
- change an easing component or tuple length;
- emit seconds instead of milliseconds;
- move motion CSS or JSON into a theme scope;
- add a global reduced-motion reset.

Each mutation must fail a targeted test and be restored immediately.

The complete gates remain:

```bash
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Two consecutive builds must produce identical checksums for `lattice.css` and
`tokens.json`.

## Documentation

The README moves primitive motion tokens into the implemented scope while
leaving semantic motion behavior, elevation and components under “Not yet.”
The existing broad spacing and motion specification remains the source for the
research and rationale; this document defines the implementation boundary for
issue #29.

## Non-goals

- semantic motion roles;
- component transition-property mappings;
- animation choreography, staggering or spring physics;
- a global reduced-motion stylesheet;
- runtime preference detection;
- elevation or shadow tokens;
- React component implementation.
