import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/button/button.js'

describe('Button', () => {
  it('defaults to soft, medium, accent', () => {
    render(<Button>Audit</Button>)
    const button = screen.getByRole('button', { name: 'Audit' })

    expect(button.dataset['variant']).toBe('soft')
    expect(button.dataset['size']).toBe('md')
    expect(button.dataset['tone']).toBe('accent')
  })

  it('maps props to data attributes', () => {
    render(
      <Button variant="solid" size="lg" tone="danger">
        Remove
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Remove' })

    expect(button.dataset['variant']).toBe('solid')
    expect(button.dataset['size']).toBe('lg')
    expect(button.dataset['tone']).toBe('danger')
  })

  it('does not let a consumer desync the attribute from the prop', () => {
    render(
      <Button variant="solid" data-variant="ghost">
        Audit
      </Button>
    )

    expect(screen.getByRole('button').dataset['variant']).toBe('solid')
  })

  it('adds className rather than replacing it', () => {
    render(<Button className="mine">Audit</Button>)
    const button = screen.getByRole('button')

    expect(button.classList.contains('lat-button')).toBe(true)
    expect(button.classList.contains('mine')).toBe(true)
  })

  it('renders as another element through render, keeping the class', () => {
    render(<Button render={<a href="/pages" />}>Pages</Button>)
    const link = screen.getByRole('link', { name: 'Pages' })

    expect(link.classList.contains('lat-button')).toBe(true)
  })
})
