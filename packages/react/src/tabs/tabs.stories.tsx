import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tab, TabList, TabPanel, TabProvider } from './tabs.js'

/**
 * Tabs activate automatically on arrow-key movement.
 *
 * That is APG's default and the right choice here: these panels are already
 * rendered, so selecting one costs nothing, and requiring Enter after every
 * arrow press is extra work for exactly the users navigating by keyboard.
 */
const meta = {
  title: 'Components/Tabs',
  component: TabList,
  tags: ['autodocs']
} satisfies Meta<typeof TabList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <TabProvider defaultSelectedId="window-30">
      <TabList aria-label="History window">
        <Tab id="window-30">30 days</Tab>
        <Tab id="window-90">90 days</Tab>
        <Tab id="window-365">365 days</Tab>
      </TabList>
      <TabPanel tabId="window-30">Thirty days of history.</TabPanel>
      <TabPanel tabId="window-90">Ninety days of history.</TabPanel>
      <TabPanel tabId="window-365">A year of history.</TabPanel>
    </TabProvider>
  )
}

/** A disabled tab stays in the roving-focus order; it just cannot be selected. */
export const WithDisabledTab: Story = {
  render: () => (
    <TabProvider defaultSelectedId="scope-page">
      <TabList aria-label="Audit scope">
        <Tab id="scope-page">This page</Tab>
        <Tab id="scope-site">Whole site</Tab>
        <Tab id="scope-flow" disabled>
          User flow
        </Tab>
      </TabList>
      <TabPanel tabId="scope-page">One page, audited on every run.</TabPanel>
      <TabPanel tabId="scope-site">Every page we can reach from the root.</TabPanel>
      <TabPanel tabId="scope-flow">Not available on this plan.</TabPanel>
    </TabProvider>
  )
}
