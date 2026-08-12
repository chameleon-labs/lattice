import {
  Menu as AriakitMenu,
  MenuGroup as AriakitMenuGroup,
  MenuGroupLabel as AriakitMenuGroupLabel,
  MenuItemCheckbox as AriakitMenuItemCheckbox,
  MenuItemRadio as AriakitMenuItemRadio,
  MenuButton as AriakitMenuButton,
  MenuItem as AriakitMenuItem,
  MenuSeparator as AriakitMenuSeparator,
  type MenuButtonProps as AriakitMenuButtonProps,
  type MenuGroupLabelProps as AriakitMenuGroupLabelProps,
  type MenuGroupProps as AriakitMenuGroupProps,
  type MenuItemCheckboxProps as AriakitMenuItemCheckboxProps,
  type MenuItemRadioProps as AriakitMenuItemRadioProps,
  type MenuItemProps as AriakitMenuItemProps,
  type MenuProps as AriakitMenuProps,
  type MenuSeparatorProps as AriakitMenuSeparatorProps,
} from '@ariakit/react';
import type {ElementType} from 'react';

// Re-exported untouched: the provider renders nothing.
export {MenuProvider} from '@ariakit/react';
export type {MenuProviderProps} from '@ariakit/react';

export type MenuProps<T extends ElementType = 'div'> = AriakitMenuProps<T>;
export interface MenuButtonOptions {
  /**
   * Renders no button chrome, for a trigger that brings its own geometry —
   * `render={<Avatar />}`. Without it both class names land on one element and
   * the button's padding collapses whatever it wrapped.
   */
  bare?: boolean;
}

export type MenuButtonProps<T extends ElementType = 'button'> = AriakitMenuButtonProps<T> & MenuButtonOptions;
export type MenuItemProps<T extends ElementType = 'div'> = AriakitMenuItemProps<T>;
export type MenuSeparatorProps<T extends ElementType = 'hr'> = AriakitMenuSeparatorProps<T>;
export type MenuItemRadioProps<T extends ElementType = 'div'> = AriakitMenuItemRadioProps<T>;
export type MenuItemCheckboxProps<T extends ElementType = 'div'> = AriakitMenuItemCheckboxProps<T>;
export type MenuGroupProps<T extends ElementType = 'div'> = AriakitMenuGroupProps<T>;
export type MenuGroupLabelProps<T extends ElementType = 'div'> = AriakitMenuGroupLabelProps<T>;

/**
 * Ariakit's menu supplies roving focus, typeahead and focus return; this
 * supplies the surface, which uses the `overlay` elevation role.
 *
 * Only the parts a tabstop screen uses are wrapped: `MenuButton`, `Menu`,
 * `MenuItem` and `MenuSeparator`, plus `MenuProvider` re-exported untouched.
 *
 * Ariakit's remaining menu parts — `MenuGroup`, `MenuItemCheckbox`,
 * `MenuItemRadio`, `MenuBar` and the rest — are available from `@ariakit/react`
 * but are deliberately not re-exported here: an unstyled part arriving through
 * this package would look like a system component and behave like an unfinished
 * one. No count is given, because that number belongs to Ariakit and moves with
 * it.
 */
export function Menu<T extends ElementType = 'div'>({className, ...props}: MenuProps<T>): React.JSX.Element {
  return (
    <AriakitMenu gutter={4} {...props} className={className === undefined ? 'lat-menu' : `lat-menu ${className}`} />
  );
}

export function MenuButton<T extends ElementType = 'button'>({
  className,
  bare = false,
  ...props
}: MenuButtonProps<T>): React.JSX.Element {
  if (bare) {
    return <AriakitMenuButton {...props} className={className} />;
  }

  return (
    <AriakitMenuButton
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant="secondary"
      data-size="md"
    />
  );
}

export function MenuItem<T extends ElementType = 'div'>({className, ...props}: MenuItemProps<T>): React.JSX.Element {
  return (
    <AriakitMenuItem
      {...props}
      className={className === undefined ? 'lat-menu__item' : `lat-menu__item ${className}`}
    />
  );
}

export function MenuSeparator<T extends ElementType = 'hr'>({
  className,
  ...props
}: MenuSeparatorProps<T>): React.JSX.Element {
  return (
    <AriakitMenuSeparator
      {...props}
      className={className === undefined ? 'lat-menu__separator' : `lat-menu__separator ${className}`}
    />
  );
}

/**
 * A choice inside a menu. The role and `aria-checked` come from here, so a
 * selected option cannot be selected only visually.
 *
 * Ariakit holds the value in the menu store — give `MenuProvider` a
 * `defaultValues` (or `values`/`setValues`) and each item a `name` and `value`.
 */
export function MenuItemRadio<T extends ElementType = 'div'>({
  className,
  ...props
}: MenuItemRadioProps<T>): React.JSX.Element {
  return (
    <AriakitMenuItemRadio
      {...props}
      className={className === undefined ? 'lat-menu__item' : `lat-menu__item ${className}`}
    />
  );
}

/** As `MenuItemRadio`, for choices that are not mutually exclusive. */
export function MenuItemCheckbox<T extends ElementType = 'div'>({
  className,
  ...props
}: MenuItemCheckboxProps<T>): React.JSX.Element {
  return (
    <AriakitMenuItemCheckbox
      {...props}
      className={className === undefined ? 'lat-menu__item' : `lat-menu__item ${className}`}
    />
  );
}

/** Groups related items. Pair with `MenuGroupLabel`, which names the group. */
export function MenuGroup<T extends ElementType = 'div'>({className, ...props}: MenuGroupProps<T>): React.JSX.Element {
  return (
    <AriakitMenuGroup
      {...props}
      className={className === undefined ? 'lat-menu__group' : `lat-menu__group ${className}`}
    />
  );
}

/** Names the enclosing `MenuGroup`. Ariakit wires the association. */
export function MenuGroupLabel<T extends ElementType = 'div'>({
  className,
  ...props
}: MenuGroupLabelProps<T>): React.JSX.Element {
  return (
    <AriakitMenuGroupLabel
      {...props}
      className={className === undefined ? 'lat-menu__group-label' : `lat-menu__group-label ${className}`}
    />
  );
}
