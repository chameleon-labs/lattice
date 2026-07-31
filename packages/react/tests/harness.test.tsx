import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('component test harness', () => {
  it('renders JSX into a DOM the assertions can read', () => {
    render(<p>lattice</p>)

    expect(screen.getByText('lattice')).toBeDefined()
  })

  // The one that matters. Without cleanup this fails, because the previous
  // test's markup is still mounted — and a component suite where mounts leak
  // into each other produces failures that look like component bugs.
  it('cleans the document between tests', () => {
    expect(screen.queryByText('lattice')).toBeNull()
  })
})
