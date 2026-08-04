import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../button/button.js'
import {
  Dialog,
  DialogDisclosure,
  DialogDismiss,
  DialogHeading,
  DialogProvider
} from './dialog.js'

/**
 * Focus trapped, focus returned, scroll locked, labelled — all four owned by
 * Ariakit. Lattice supplies the surface, which shares `--lat-elevation-overlay`
 * with Menu.
 *
 * `tests/browser/a11y.spec.ts` drives the `Closed` story: it clicks the trigger,
 * tabs past the last control to prove the trap holds, presses Escape, and
 * asserts focus lands back on the trigger. That test used to click into a page
 * shared with thirteen other component families.
 */
const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs']
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

function Confirmation() {
  return (
    <>
      <DialogHeading>Remove this page?</DialogHeading>
      <p>This cannot be undone. Its audit history is removed with it.</p>
      <div className="lat-story__row">
        <DialogDismiss render={<Button tone="neutral" />}>Cancel</DialogDismiss>
        <DialogDismiss render={<Button variant="solid" tone="danger" />}>Remove</DialogDismiss>
      </div>
    </>
  )
}

/** The trigger alone. Opening it is what the browser tests do. */
export const Closed: Story = {
  render: () => (
    <DialogProvider>
      <DialogDisclosure>Remove page</DialogDisclosure>
      <Dialog>
        <Confirmation />
      </Dialog>
    </DialogProvider>
  )
}

/**
 * Open on arrival, so the accessibility sweep actually scans the dialog surface.
 *
 * Without this story axe would only ever see the trigger button: the sweep
 * visits a story and scans what it renders, and a closed dialog renders nothing.
 * The shared demo page had the same blind spot.
 */
export const Open: Story = {
  render: () => (
    <DialogProvider defaultOpen>
      <DialogDisclosure>Remove page</DialogDisclosure>
      <Dialog>
        <Confirmation />
      </Dialog>
    </DialogProvider>
  )
}
