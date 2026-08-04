import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control/segmented-control.js'

describe('SegmentedControl', () => {
  const control = (
    <SegmentedControl defaultValue="system" aria-label="Theme">
      <SegmentedControlItem value="system">System</SegmentedControlItem>
      <SegmentedControlItem value="light">Light</SegmentedControlItem>
      <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
    </SegmentedControl>
  )

  it('exposes its items as radios in a labelled group', () => {
    render(control)
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeDefined()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('checks the default value', () => {
    render(control)
    expect((screen.getByRole('radio', { name: 'System' }) as HTMLInputElement).checked).toBe(true)
  })

  it('moves selection with the arrow keys', async () => {
    const user = userEvent.setup()
    render(control)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect((screen.getByRole('radio', { name: 'Light' }) as HTMLInputElement).checked).toBe(true)
  })
})
