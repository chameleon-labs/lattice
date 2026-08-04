import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '../src/button/button.js'

describe('Button', () => {
  it('defaults to the secondary variant', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button').dataset['variant']).toBe('secondary')
  })

  it('accepts each Meridian variant', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'destructive', 'link'] as const) {
      const { unmount } = render(<Button variant={variant}>Go</Button>)
      expect(screen.getByRole('button').dataset['variant']).toBe(variant)
      unmount()
    }
  })

  it('no longer accepts a tone', () => {
    // @ts-expect-error tone was removed with the variant x tone matrix
    render(<Button tone="danger">Delete</Button>)
    expect(screen.getByRole('button').dataset['tone']).toBeUndefined()
  })

  it('defaults size to md', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button').dataset['size']).toBe('md')
  })

  it('does not let a consumer desync the attribute from the prop', () => {
    render(
      <Button variant="primary" data-variant="ghost">
        Audit
      </Button>
    )

    expect(screen.getByRole('button').dataset['variant']).toBe('primary')
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
