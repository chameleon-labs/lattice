import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

// The token stylesheet first: every component value is a var() reference into it.
import '@chameleon-labs/lattice-tokens/lattice.css'
import '../src/styles.css'
import './demo.css'

import { Button, Input, Switch, TextField } from '../src/index.js'

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
