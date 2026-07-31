import {
  Menu as AriakitMenu,
  MenuButton as AriakitMenuButton,
  MenuItem as AriakitMenuItem,
  MenuSeparator as AriakitMenuSeparator,
  type MenuButtonProps as AriakitMenuButtonProps,
  type MenuItemProps as AriakitMenuItemProps,
  type MenuProps as AriakitMenuProps,
  type MenuSeparatorProps as AriakitMenuSeparatorProps
} from '@ariakit/react'
import type { ElementType } from 'react'

// Re-exported untouched: the provider renders nothing.
export { MenuProvider } from '@ariakit/react'
export type { MenuProviderProps } from '@ariakit/react'

export type MenuProps<T extends ElementType = 'div'> = AriakitMenuProps<T>
export type MenuButtonProps<T extends ElementType = 'button'> = AriakitMenuButtonProps<T>
export type MenuItemProps<T extends ElementType = 'div'> = AriakitMenuItemProps<T>
export type MenuSeparatorProps<T extends ElementType = 'hr'> = AriakitMenuSeparatorProps<T>

/**
 * Ariakit's menu supplies roving focus, typeahead and focus return; this
 * supplies the surface, which uses the `overlay` elevation role.
 *
 * Only the parts a tabstop screen uses are wrapped. `MenuGroup`,
 * `MenuItemCheckbox`, `MenuItemRadio`, `MenuBar` and the rest of Ariakit's
 * eighteen parts are available but unstyled, and are deliberately not
 * re-exported: an unstyled part reaching a consumer through this package would
 * look like a system component and behave like an unfinished one.
 */
export function Menu<T extends ElementType = 'div'>({ className, ...props }: MenuProps<T>) {
  return (
    <AriakitMenu
      gutter={4}
      {...props}
      className={className === undefined ? 'lat-menu' : `lat-menu ${className}`}
    />
  )
}

export function MenuButton<T extends ElementType = 'button'>({
  className,
  ...props
}: MenuButtonProps<T>) {
  return (
    <AriakitMenuButton
      {...props}
      className={className === undefined ? 'lat-button' : `lat-button ${className}`}
      data-variant="soft"
      data-size="md"
      data-tone="accent"
    />
  )
}

export function MenuItem<T extends ElementType = 'div'>({
  className,
  ...props
}: MenuItemProps<T>) {
  return (
    <AriakitMenuItem
      {...props}
      className={className === undefined ? 'lat-menu__item' : `lat-menu__item ${className}`}
    />
  )
}

export function MenuSeparator<T extends ElementType = 'hr'>({
  className,
  ...props
}: MenuSeparatorProps<T>) {
  return (
    <AriakitMenuSeparator
      {...props}
      className={
        className === undefined ? 'lat-menu__separator' : `lat-menu__separator ${className}`
      }
    />
  )
}
