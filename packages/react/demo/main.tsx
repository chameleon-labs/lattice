import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

// The token stylesheet first: every component value is a var() reference into it.
import '@chameleon-labs/lattice-tokens/lattice.css'
import '../src/styles.css'
import './demo.css'

import {
  Badge,
  Button,
  Callout,
  Card,
  Dialog,
  DialogDisclosure,
  DialogDismiss,
  DialogHeading,
  DialogProvider,
  Disclosure,
  DisclosureContent,
  DisclosureProvider,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuProvider,
  MenuSeparator,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabProvider,
  TextField
} from '../src/index.js'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      <div className="demo-row">{children}</div>
    </section>
  )
}

// The demo is a test fixture, not a showcase: if a variant is not rendered here,
// no axe scan covers it. Every variant of every component belongs in Gallery.
function Gallery({ theme }: { theme: string }) {
  return (
    <>
      <Section title="Button">
        {(['solid', 'soft', 'ghost'] as const).flatMap((variant) =>
          (['accent', 'neutral', 'danger'] as const).flatMap((tone) =>
            (['sm', 'md', 'lg'] as const).map((size) => (
              <Button key={`${variant}-${tone}-${size}`} variant={variant} tone={tone} size={size}>
                {variant} {tone} {size}
              </Button>
            ))
          )
        )}
        <Button disabled>disabled</Button>
        <Button render={<a href="#top" />}>as a link</Button>
      </Section>

      <Section title="Input">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Input key={size} size={size} aria-label={`URL ${size}`} placeholder={`size ${size}`} />
        ))}
        <Input aria-label="URL invalid" invalid placeholder="invalid" />
        <Input aria-label="URL disabled" disabled placeholder="disabled" />
      </Section>

      <Section title="Card">
        <Card>
          <h4>example.com/checkout</h4>
          <p>Score 72 — 3 critical, 5 serious.</p>
        </Card>
      </Section>

      <Section title="Badge">
        {(['neutral', 'accent', 'success', 'warning', 'danger'] as const).map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
        {(['critical', 'serious', 'moderate', 'minor'] as const).map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </Section>

      <Section title="Callout">
        {(['neutral', 'accent', 'success', 'warning', 'danger'] as const).map((tone) => (
          <Callout key={tone} tone={tone} title={`${tone} callout`}>
            The page took too long to respond. Try again in a minute.
          </Callout>
        ))}
      </Section>

      <Section title="Menu">
        <MenuProvider>
          <MenuButton>Actions</MenuButton>
          <Menu>
            <MenuItem>Pause monitoring</MenuItem>
            <MenuItem>Copy link</MenuItem>
            <MenuSeparator />
            <MenuItem>Remove page</MenuItem>
          </Menu>
        </MenuProvider>
      </Section>

      <Section title="Dialog">
        <DialogProvider>
          <DialogDisclosure>Remove page</DialogDisclosure>
          <Dialog>
            <DialogHeading>Remove this page?</DialogHeading>
            <p>This cannot be undone. Its audit history is removed with it.</p>
            <DialogDismiss render={<Button tone="neutral" />}>Cancel</DialogDismiss>
            <DialogDismiss render={<Button variant="solid" tone="danger" />}>Remove</DialogDismiss>
          </Dialog>
        </DialogProvider>
      </Section>

      <Section title="Disclosure">
        <DisclosureProvider>
          <Disclosure>Affected nodes</Disclosure>
          <DisclosureContent>
            <p>Three nodes match this rule.</p>
          </DisclosureContent>
        </DisclosureProvider>
      </Section>

      <Section title="Tabs">
        <TabProvider defaultSelectedId={`${theme}-30`}>
          <TabList aria-label="History window">
            <Tab id={`${theme}-30`}>30 days</Tab>
            <Tab id={`${theme}-90`}>90 days</Tab>
            <Tab id={`${theme}-365`}>365 days</Tab>
          </TabList>
          <TabPanel tabId={`${theme}-30`}>Thirty days of history.</TabPanel>
          <TabPanel tabId={`${theme}-90`}>Ninety days of history.</TabPanel>
          <TabPanel tabId={`${theme}-365`}>A year of history.</TabPanel>
        </TabProvider>
      </Section>

      <Section title="Switch">
        <label htmlFor={`${theme}-switch-off`}>Paused</label>
        <Switch id={`${theme}-switch-off`} />
        <label htmlFor={`${theme}-switch-on`}>Monitoring</label>
        <Switch id={`${theme}-switch-on`} defaultChecked />
        <label htmlFor={`${theme}-switch-disabled`}>Unavailable</label>
        <Switch id={`${theme}-switch-disabled`} disabled />
      </Section>

      <Section title="TextField">
        <TextField label="Plain" />
        <TextField label="Described" description="We audit the page at this address." />
        <TextField label="In error" error="That address can't be audited." />
        <TextField
          label="Both"
          description="We audit the page at this address."
          error="That address can't be audited."
        />
      </Section>
    </>
  )
}

const container = document.getElementById('root')

if (container === null) {
  throw new Error('demo: #root is missing from index.html')
}

// Both modes render on one page in scoped [data-lat-theme] sections. That
// attribute exists precisely so a theme can scope to any element, and one page
// halves the browser-test count without weakening anything: axe measures
// computed colour, which is per-element.
createRoot(container).render(
  <StrictMode>
    <main>
      <h1 id="top">Lattice components</h1>
      <div data-lat-theme="light" id="theme-light">
        <h2>Light</h2>
        <Gallery theme="light" />
      </div>
      <div data-lat-theme="dark" id="theme-dark">
        <h2>Dark</h2>
        <Gallery theme="dark" />
      </div>
    </main>
  </StrictMode>
)
