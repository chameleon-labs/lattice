# Menu

`MenuButton`, `Menu`, `MenuItem`, `MenuSeparator`, and `MenuProvider`
(re-exported from Ariakit unchanged).

```tsx
<MenuProvider>
  <MenuButton>Actions</MenuButton>
  <Menu>
    <MenuItem>Pause monitoring</MenuItem>
    <MenuSeparator />
    <MenuItem>Remove page</MenuItem>
  </Menu>
</MenuProvider>
```

Ariakit supplies roving focus, typeahead and focus return; this supplies the
surface, which uses the **overlay** elevation role — surface, border and shadow
together.

`MenuButton` renders a Lattice button by default. Pass `bare` when the trigger
brings its own geometry — an [`Avatar`](../avatar/README.md), say — and the
chrome is omitted entirely rather than layered over it:

```tsx
<MenuButton bare aria-label="Account menu" render={<Avatar name="Ada Lovelace" decorative />} />
```

Without it both class names land on one element and the button's padding
collapses whatever it wrapped.

Only the parts a tabstop screen uses are wrapped: `MenuButton`, `Menu`,
`MenuItem` and `MenuSeparator`, plus `MenuProvider` re-exported untouched.

Ariakit's remaining menu parts are available from `@ariakit/react` but are
deliberately not re-exported here: an unstyled part arriving through this
package would look like a system component and behave like an unfinished one.

**Classes:** `.lat-menu`, `.lat-menu__item`, `.lat-menu__separator`. The
keyboard position styles off `[data-active-item]`, because DOM focus stays on
the menu.
