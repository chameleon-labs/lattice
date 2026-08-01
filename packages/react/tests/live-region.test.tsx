import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LiveRegion } from '../src/live-region/live-region.js'

describe('LiveRegion', () => {
  it('renders the container empty before the first message', () => {
    render(<LiveRegion message="" />)
    const region = screen.getByRole('status')

    // Present from the first paint. A live region inserted at announcement
    // time is not reliably read.
    expect(region.textContent).toBe('')
    expect(region.getAttribute('aria-live')).toBe('polite')
  })

  it('announces a message', async () => {
    render(<LiveRegion message="Running the accessibility engine" />)

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Running the accessibility engine')
    })
  })

  // The guarantee. A poll that returns the same phase must not re-announce.
  it('does not touch the DOM when the message is unchanged', async () => {
    const { rerender } = render(<LiveRegion message="Fetching the page" />)
    const region = screen.getByRole('status')

    await waitFor(() => {
      expect(region.textContent).toBe('Fetching the page')
    })

    const mutations = vi.fn()
    const watcher = new MutationObserver(mutations)
    watcher.observe(region, { childList: true, characterData: true, subtree: true })

    rerender(<LiveRegion message="Fetching the page" />)
    rerender(<LiveRegion message="Fetching the page" />)

    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(mutations).not.toHaveBeenCalled()

    watcher.disconnect()
  })

  it('updates when the message genuinely changes', async () => {
    const { rerender } = render(<LiveRegion message="Fetching the page" />)

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Fetching the page')
    })

    rerender(<LiveRegion message="Scoring" />)

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Scoring')
    })
  })

  it('uses role=alert when asked to be assertive', () => {
    render(<LiveRegion message="Audit failed" politeness="assertive" />)

    expect(screen.getByRole('alert').getAttribute('aria-live')).toBe('assertive')
  })
})
