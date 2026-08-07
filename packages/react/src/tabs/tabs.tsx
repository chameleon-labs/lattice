import {
  Tab as AriakitTab,
  TabList as AriakitTabList,
  TabPanel as AriakitTabPanel,
  type TabListProps as AriakitTabListProps,
  type TabPanelProps as AriakitTabPanelProps,
  type TabProps as AriakitTabProps,
} from '@ariakit/react';
import type {ElementType} from 'react';

// Re-exported untouched: the provider renders nothing.
export {TabProvider} from '@ariakit/react';
export type {TabProviderProps} from '@ariakit/react';

export type TabListProps<T extends ElementType = 'div'> = AriakitTabListProps<T>;
export type TabProps<T extends ElementType = 'button'> = AriakitTabProps<T>;
export type TabPanelProps<T extends ElementType = 'div'> = AriakitTabPanelProps<T>;

/**
 * Tabs activate automatically on arrow-key movement.
 *
 * That is APG's default and the right choice here: these panels are already
 * rendered, so selecting one costs nothing, and requiring Enter after every
 * arrow press is extra work for exactly the users navigating by keyboard.
 * Manual activation belongs to a panel that is expensive to build, and Ariakit
 * exposes it through the store when one appears.
 */
export function TabList<T extends ElementType = 'div'>({className, ...props}: TabListProps<T>): React.JSX.Element {
  return (
    <AriakitTabList {...props} className={className === undefined ? 'lat-tab-list' : `lat-tab-list ${className}`} />
  );
}

export function Tab<T extends ElementType = 'button'>({className, ...props}: TabProps<T>): React.JSX.Element {
  return <AriakitTab {...props} className={className === undefined ? 'lat-tab' : `lat-tab ${className}`} />;
}

export function TabPanel<T extends ElementType = 'div'>({className, ...props}: TabPanelProps<T>): React.JSX.Element {
  return (
    <AriakitTabPanel {...props} className={className === undefined ? 'lat-tab-panel' : `lat-tab-panel ${className}`} />
  );
}
