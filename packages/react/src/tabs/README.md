# Tabs

`TabList`, `Tab`, `TabPanel`, and `TabProvider` (re-exported from Ariakit
unchanged).

```tsx
<TabProvider defaultSelectedId="30">
  <TabList aria-label="History window">
    <Tab id="30">30 days</Tab>
    <Tab id="90">90 days</Tab>
  </TabList>
  <TabPanel tabId="30">…</TabPanel>
  <TabPanel tabId="90">…</TabPanel>
</TabProvider>
```

**Tabs activate automatically** on arrow-key movement. That is APG's default and
right here: the panels are already rendered, so selecting one costs nothing, and
requiring Enter after every arrow press is extra work for exactly the users
navigating by keyboard.

**Classes:** `.lat-tab-list`, `.lat-tab`, `.lat-tab-panel`. Selection styles off
`[aria-selected='true']` and is marked with a **border**, which survives
`forced-colors` where a background is flattened.
