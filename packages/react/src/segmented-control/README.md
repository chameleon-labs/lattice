# SegmentedControl

`SegmentedControl` and `SegmentedControlItem` — a `bg-subtle` track, 2px
padded, with an active thumb at `bg-raised` carrying the `raised` shadow.

```tsx
<SegmentedControl defaultValue="system" aria-label="Theme">
  <SegmentedControlItem value="system">System</SegmentedControlItem>
  <SegmentedControlItem value="light">Light</SegmentedControlItem>
  <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
</SegmentedControl>
```

Built on Ariakit's **radio store**, not its tabs. The control selects a value;
it does not reveal a panel. That distinction is what a screen reader
announces — a segmented control built on tabs would announce itself as a
tablist and promise panels that do not exist, so this is a semantics decision,
not a styling one. It announces as a `radiogroup` of `radio` items, with the
same arrow-key roving focus a native radio group has.

`SegmentedControl` accepts `defaultValue` / `value` / `setValue`, mirroring
Ariakit's `RadioProvider`. Each `SegmentedControlItem` takes a required
`value`.

Each item renders a real, visually-hidden `<input type="radio">` inside a
`<label>` — hidden with a clip-path, never `display: none`, which would
remove it from both the accessibility tree and the tab order and destroy the
radio semantics the whole component is built on. The label carries the
appearance; the input carries the semantics and the focus target.

**Classes:** `.lat-segmented-control`, `.lat-segmented-control__item`,
`.lat-segmented-control__input`, `.lat-segmented-control__label`. Labels use
the `code` text role (mono), matching Meridian's own control.
