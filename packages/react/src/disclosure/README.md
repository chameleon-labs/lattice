# Disclosure

`Disclosure`, `DisclosureContent`, and `DisclosureProvider` (re-exported from
Ariakit unchanged — it renders nothing).

```tsx
<DisclosureProvider>
  <Disclosure>Affected nodes</Disclosure>
  <DisclosureContent>…</DisclosureContent>
</DisclosureProvider>
```

A real `<button>` carrying `aria-expanded`, which is what #19 asks for by name:
the violation rows must be buttons, not clickable divs.

Ariakit keeps the content **mounted and marked `hidden`** rather than unmounting
it. `hidden` removes it from the accessibility tree and from layout, and the
stable DOM is what lets it animate open without measuring twice.

`Disclosure` draws the ghost-button construction by default. Pass `bare` when
the trigger is a whole row that expands rather than a button above one, and the
padding, border and hover wash are omitted rather than layered over it.

It is the same prop, for the same reason, as `MenuButton` and
`DialogDisclosure`: a wrapper whose job is behaviour should not impose
appearance a caller cannot decline.

**Classes:** `.lat-disclosure`, `.lat-disclosure__content`.
