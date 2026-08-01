import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from '../src/badge/badge.js'
import { Callout } from '../src/callout/callout.js'
import { Card } from '../src/card/card.js'

describe('Card', () => {
  it('renders a plain container with no role', () => {
    render(<Card>Audit summary</Card>)
    const card = screen.getByText('Audit summary')

    // A card never becomes role="button". An interactive card exposes its
    // action through a real control inside it, which keeps one accessible name
    // and one tab stop.
    expect(card.getAttribute('role')).toBeNull()
    expect(card.tagName).toBe('DIV')
  })

  it('adds className rather than replacing it', () => {
    render(<Card className="mine">Audit summary</Card>)
    const card = screen.getByText('Audit summary')

    expect(card.classList.contains('lat-card')).toBe(true)
    expect(card.classList.contains('mine')).toBe(true)
  })
})

describe('Badge', () => {
  it('defaults to the neutral tone', () => {
    render(<Badge>paused</Badge>)

    expect(screen.getByText('paused').dataset['tone']).toBe('neutral')
  })

  it('accepts an axe impact string directly as a tone', () => {
    render(<Badge tone="critical">critical</Badge>)

    expect(screen.getByText('critical').dataset['tone']).toBe('critical')
  })

  // The guarantee: text always accompanies colour. `children` is required in
  // the type, so a colour-only badge cannot be written.
  it('always carries text alongside its colour', () => {
    render(<Badge tone="serious">3 serious</Badge>)

    expect(screen.getByText('3 serious').textContent).not.toBe('')
  })
})

describe('Callout', () => {
  it('renders its children with the neutral tone by default', () => {
    render(<Callout>That address cannot be audited.</Callout>)

    expect(screen.getByText('That address cannot be audited.')).toBeDefined()
  })

  // A callout present on first render with role="alert" announces out of
  // context, which is worse than silence. The live role is opt-in.
  it('has no live role by default', () => {
    const { container } = render(<Callout>Audit failed.</Callout>)
    const callout = container.querySelector('.lat-callout')

    expect(callout?.getAttribute('role')).toBeNull()
    expect(callout?.getAttribute('aria-live')).toBeNull()
  })

  it('takes role="status" when asked to announce politely', () => {
    render(<Callout live="polite">Audit complete.</Callout>)

    expect(screen.getByRole('status')).toBeDefined()
  })

  it('takes role="alert" when asked to announce assertively', () => {
    render(<Callout live="assertive">Audit failed.</Callout>)

    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('renders its title as a heading before the body', () => {
    render(<Callout title="Rate limited">Try again in a minute.</Callout>)

    expect(screen.getByText('Rate limited')).toBeDefined()
    expect(screen.getByText('Try again in a minute.')).toBeDefined()
  })
})
