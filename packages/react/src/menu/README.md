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

## A choice inside a menu

`MenuItemRadio` and `MenuItemCheckbox` carry their own role and
`aria-checked`, and `MenuGroupLabel` names the group Ariakit associates it
with. None of that is the call site's to remember:

```tsx
<MenuProvider defaultValues={{theme: 'system'}}>
  <MenuButton>Preferences</MenuButton>
  <Menu>
    <MenuGroup>
      <MenuGroupLabel>Theme</MenuGroupLabel>
      <MenuItemRadio name="theme" value="system">Match system</MenuItemRadio>
      <MenuItemRadio name="theme" value="dark">Dark</MenuItemRadio>
    </MenuGroup>
  </Menu>
</MenuProvider>
```

The value lives in the menu store — `MenuProvider` takes `defaultValues`, or
`values`/`setValues` to hold it yourself. Selecting a choice does not dismiss
the menu, which is Ariakit's default for a checkable item and the right one: a
menu you are still choosing in should stay open.

The checked mark is **drawn in CSS**, not an icon. This package ships no glyphs,
and a mark in `currentColor` survives `forced-colors`, where a background
signal is flattened away. A checkable item reserves the indicator column whether
or not it is checked, so labels line up.

## What is wrapped

`MenuButton`, `Menu`, `MenuItem`, `MenuItemRadio`, `MenuItemCheckbox`,
`MenuGroup`, `MenuGroupLabel` and `MenuSeparator`, plus `MenuProvider`
re-exported untouched.

The rule is not "whatever a screen happened to need". That criterion is what
left the checkable item unwrapped until a screen hand-rolled one out of
`MenuItem`, `role="menuitemradio"` and `aria-checked`. A part belongs here when
leaving it out would push semantics onto the call site.

Ariakit's remaining menu parts are available from `@ariakit/react` but are
deliberately not re-exported here: an unstyled part arriving through this
package would look like a system component and behave like an unfinished one.

**Classes:** `.lat-menu`, `.lat-menu__item`, `.lat-menu__separator`. The
keyboard position styles off `[data-active-item]`, because DOM focus stays on
the menu.
