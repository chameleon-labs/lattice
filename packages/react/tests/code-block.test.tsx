import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CodeBlock } from '../src/code-block/code-block.js'

// jsdom already defines `navigator.clipboard` as a getter-only accessor, so
// `Object.assign(navigator, { clipboard: … })` fails — silently, because the
// assignment is dropped rather than throwing. `defineProperty` with
// `configurable: true` replaces the accessor outright and can be re-stubbed
// test to test.
//
// It must run *after* `userEvent.setup()`, not before: `setup()` installs its
// own clipboard stub on `navigator.clipboard` for paste support, which would
// otherwise overwrite this one and leave `writeText` uncalled.
const stubClipboard = (writeText: ReturnType<typeof vi.fn>): void => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true
  })
}

describe('CodeBlock', () => {
  it('announces the copy rather than only changing an icon', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)

    render(<CodeBlock code="--lat-solid" />)
    await user.click(screen.getByRole('button', { name: /copy/i }))

    expect(writeText).toHaveBeenCalledWith('--lat-solid')
    const status = await screen.findByRole('status')
    expect(status.textContent ?? '').toMatch(/copied/i)
  })

  it(
    're-announces a second copy of the same text rather than deduplicating it',
    async () => {
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      stubClipboard(writeText)

      render(<CodeBlock code="--lat-solid" />)
      const button = screen.getByRole('button', { name: /copy/i })
      const status = screen.getByRole('status')

      await user.click(button)
      await waitFor(() => expect(status.textContent ?? '').toMatch(/copied/i))

      // The message clears itself ~1.5s after the copy, in real time — this is
      // the state that makes a second, identical copy a genuine change (''  →
      // 'Copied to clipboard') rather than a no-op LiveRegion update the
      // component would otherwise deduplicate away.
      await waitFor(() => expect(status.textContent).toBe(''), { timeout: 3000 })

      await user.click(button)
      await waitFor(() => expect(status.textContent ?? '').toMatch(/copied/i))
    },
    10000
  )
})
