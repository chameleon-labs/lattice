# Dialog

`Dialog`, `DialogHeading`, `DialogDismiss`, `DialogDisclosure`, and
`DialogProvider` (re-exported from Ariakit unchanged).

```tsx
<DialogProvider>
  <DialogDisclosure>Remove page</DialogDisclosure>
  <Dialog>
    <DialogHeading>Remove this page?</DialogHeading>
    <p>This cannot be undone.</p>
    <DialogDismiss render={<Button variant="secondary" />}>Cancel</DialogDismiss>
  </Dialog>
</DialogProvider>
```

Focus trap, focus return, scroll lock and labelling all come from Ariakit. #20
states its confirmation must not be `window.confirm`; this is what makes that
practical rather than aspirational.

Ariakit marks the rest of the document **inert through a portal** rather than
setting `aria-modal` — the stronger of the two mechanisms. The heading names the
dialog, so the accessible name is not left to whichever text node the browser
finds first.

`DialogDisclosure` renders a Lattice button by default. Pass `bare` when the
trigger brings its own geometry — an [`Avatar`](../avatar/README.md), say — and
the chrome is omitted rather than layered over it:

```tsx
<DialogDisclosure bare aria-label="Open account" render={<Avatar name="Ada Lovelace" decorative />} />
```

Without it both class names land on one element and the button's padding
collapses whatever it wrapped. `render={<a href="…" />}` still gets the button
appearance, which is the case `bare` deliberately leaves alone.

**Classes:** `.lat-dialog`, `.lat-dialog__backdrop`, `.lat-dialog__heading`,
`.lat-dialog__dismiss`. Uses the **overlay** elevation role, shared with Menu.
The centring transform
is static; only the entrance lift is gated behind `no-preference`, so under
`reduce` the dialog still fades in and is still centred.
