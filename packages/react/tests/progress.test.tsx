import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Progress } from '../src/progress/progress.js'

/** The scale factor the stylesheet draws the fill from. */
const fillRatio = (bar: HTMLElement): string => bar.style.getPropertyValue('--_lat-progress')

describe('Progress', () => {
  it('is a named progressbar — the whole reason `label` is required', () => {
    render(<Progress label="Audit progress" value={50} />)
    expect(screen.getByRole('progressbar', { name: 'Audit progress' })).toBeTruthy()
  })

  it('reports the range and the current value', () => {
    render(<Progress label="Audit progress" value={4} max={6} />)
    const bar = screen.getByRole('progressbar')

    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('6')
    expect(bar.getAttribute('aria-valuenow')).toBe('4')
  })

  it('speaks the value text instead of a bare percentage when given one', () => {
    render(<Progress label="Audit progress" value={4} max={6} valueText="Step 4 of 6" />)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('Step 4 of 6')
  })

  it('omits aria-valuetext entirely rather than setting it empty', () => {
    render(<Progress label="Audit progress" value={1} />)
    expect(screen.getByRole('progressbar').hasAttribute('aria-valuetext')).toBe(false)
  })

  // The defect this prevents is a caller's off-by-one drawing a fill wider than
  // its track, or announcing a negative percentage.
  it('clamps out-of-range values at both ends', () => {
    const { rerender } = render(<Progress label="Over" value={180} />)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')

    rerender(<Progress label="Under" value={-40} />)
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0')
  })

  it('falls back to a usable max rather than dividing by zero', () => {
    render(<Progress label="Audit progress" value={50} max={0} />)
    const bar = screen.getByRole('progressbar')

    expect(bar.getAttribute('aria-valuemax')).toBe('100')
    expect(bar.getAttribute('aria-valuenow')).toBe('50')
  })

  // The fill and the announced value are computed once, together. A version
  // that derived them separately would eventually disagree with itself, and
  // the disagreement would only be visible to someone who could not see the bar.
  it('draws the fill from the same clamped number it announces', () => {
    render(<Progress label="Audit progress" value={3} max={6} />)
    const bar = screen.getByRole('progressbar')

    expect(bar.getAttribute('aria-valuenow')).toBe('3')
    expect(fillRatio(bar)).toBe('0.5')
  })

  it('keeps a caller-supplied class and style alongside its own', () => {
    render(<Progress label="Audit progress" value={10} className="mine" style={{ opacity: 0.5 }} />)
    const bar = screen.getByRole('progressbar')

    expect(bar.classList.contains('lat-progress')).toBe(true)
    expect(bar.classList.contains('mine')).toBe(true)
    expect(bar.style.opacity).toBe('0.5')
  })
})
