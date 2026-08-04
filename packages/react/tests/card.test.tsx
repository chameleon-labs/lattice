import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, CardBody, CardHeader } from '../src/card/card.js'

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

  it('renders a header label as an eyebrow', () => {
    render(
      <Card>
        <CardHeader label="Button" />
        <CardBody>content</CardBody>
      </Card>
    )
    expect(screen.getByText('Button').className).toBe('lat-card__label')
  })

  it('renders header content beside the label', () => {
    render(
      <Card>
        <CardHeader label="Tokens">
          <span data-testid="aside">12</span>
        </CardHeader>
      </Card>
    )
    expect(screen.getByTestId('aside')).toBeDefined()
  })
})
