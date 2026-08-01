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

**Classes:** `.lat-disclosure`, `.lat-disclosure__content`.
