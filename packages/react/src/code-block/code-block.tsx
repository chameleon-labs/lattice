import type { HTMLAttributes } from 'react'
import { useState } from 'react'
import { LiveRegion } from '../live-region/live-region.js'
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js'

export interface CodeBlockProps extends HTMLAttributes<HTMLDivElement> {
  code: string
  /** Accessible name for the copy control. */
  copyLabel?: string
  /**
   * Accessible name for the scrollable code region itself (the `<pre>`,
   * exposed as `role="region"` — see below). Defaults to a generic label
   * that is fine for a page with one `CodeBlock`; a page with more than one
   * must give each a distinct value, since `landmark-unique` (part of the
   * default axe rule set) fails a document where two regions share both a
   * role and a name.
   */
  regionLabel?: string
}

/**
 * A mono block with a copy control.
 *
 * The bundle's version swaps a clipboard icon for a tick and says nothing. A
 * change that only exists as an icon swap is invisible to a screen reader, so
 * this one announces the result in a live region *as well* — additive to a
 * sighted cue, not instead of one. `LiveRegion` renders visible by default and
 * expects a consumer that wants it silent to wrap it, which is what happens
 * here: the announcement stays in the accessibility tree without pushing the
 * panel's own layout around.
 *
 * The button's label stays put. Swapping its text to "Copied" would change the
 * accessible name mid-interaction — the sighted cue instead colours the
 * existing label via `data-copied`, which `code-block.css` keys on.
 */
export function CodeBlock({
  code,
  copyLabel = 'Copy code',
  regionLabel = 'Code sample',
  className,
  ...props
}: CodeBlockProps) {
  const [message, setMessage] = useState('')

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setMessage('Copied to clipboard')
    // Cleared so a second copy of the same text announces again rather than
    // being deduplicated as an unchanged region, and so the button's copied
    // state is transient rather than sticky.
    window.setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div
      {...props}
      className={className === undefined ? 'lat-code-block' : `lat-code-block ${className}`}
    >
      {/* `overflow-x: auto` (code-block.css) makes this scrollable whenever a
          line overruns the block — reachable by mouse drag and, since the
          content is real text, by a screen reader, but with nothing to give
          it a tab stop a keyboard-only user could reach. `tabIndex={0}` puts
          it in the tab order; `role="region"` + `aria-label` gives it a name
          once focused, since a bare `<pre>` announces none. */}
      <pre className="lat-code-block__pre" tabIndex={0} role="region" aria-label={regionLabel}>{code}</pre>
      <button
        type="button"
        className="lat-code-block__copy"
        data-copied={message === '' ? undefined : ''}
        onClick={copy}
      >
        {copyLabel}
      </button>
      {/* LiveRegion takes a `message` prop, not children, and holds the last
          announced string so an identical update is not re-announced.
          VisuallyHidden keeps it out of the visual layout without removing it
          from the accessibility tree. */}
      <VisuallyHidden>
        <LiveRegion message={message} />
      </VisuallyHidden>
    </div>
  )
}
