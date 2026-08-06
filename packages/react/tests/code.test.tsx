import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Code } from '../src/code/code.js'

describe('Code', () => {
  it('renders a real code element, so it is announced as code', () => {
    render(<Code>color-contrast</Code>)
    const el = screen.getByText('color-contrast')

    expect(el.tagName).toBe('CODE')
    expect(el.classList.contains('lat-code')).toBe(true)
  })

  it('keeps a caller-supplied class alongside its own', () => {
    render(<Code className="mine">html-has-lang</Code>)
    const el = screen.getByText('html-has-lang')

    expect(el.classList.contains('lat-code')).toBe(true)
    expect(el.classList.contains('mine')).toBe(true)
  })

  it('forwards arbitrary attributes', () => {
    render(<Code data-testid="fragment" title="A rule id">region</Code>)
    expect(screen.getByTestId('fragment').getAttribute('title')).toBe('A rule id')
  })
})
