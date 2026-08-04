import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Callout } from '../src/callout/callout.js'

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
