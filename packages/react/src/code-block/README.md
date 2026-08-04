# CodeBlock

`CodeBlock` — a mono block with a copy control.

```tsx
<CodeBlock code="--lat-solid" />
<CodeBlock code={snippet} copyLabel="Copy package name" />
```

| Prop | Values | Default |
|---|---|---|
| `code` | `string` | — |
| `copyLabel` | `string` | `'Copy code'` |

Meridian's own bundled version swaps a clipboard icon for a tick and says
nothing. A change that exists only as an icon swap is invisible to a screen
reader, so this one announces the result in a [`LiveRegion`](../live-region/README.md)
as well — `"Copied to clipboard"`, cleared after 1.5s so a second copy of the
same text announces again rather than being deduplicated as an unchanged
region.

**The copy control is reachable and visible by keyboard, not only by hover.**
`.lat-code-block__copy` sits at `opacity: 0` until the block is hovered *or*
the button itself reaches `:focus-visible` — it never leaves the tab order,
so Tabbing to it is always enough to reveal and use it, unlike a hover-only
reveal that a keyboard user could never trigger.

**Classes:** `.lat-code-block`, `.lat-code-block__pre`,
`.lat-code-block__copy`.
