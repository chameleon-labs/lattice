import { useState } from 'react'
import { LiveRegion } from '../live-region/live-region.js'

export interface CodeBlockProps {
  code: string
  /** Accessible name for the copy control. */
  copyLabel?: string
}

/**
 * A mono block with a copy control.
 *
 * The bundle's version swaps a clipboard icon for a tick and says nothing. A
 * change that only exists as an icon swap is invisible to a screen reader, so
 * this one announces the result in a live region as well.
 */
export function CodeBlock({ code, copyLabel = 'Copy code' }: CodeBlockProps) {
  const [message, setMessage] = useState('')

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setMessage('Copied to clipboard')
    // Cleared so a second copy of the same text announces again rather than
    // being deduplicated as an unchanged region.
    window.setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div className="lat-code-block">
      <pre className="lat-code-block__pre">{code}</pre>
      <button type="button" className="lat-code-block__copy" onClick={copy}>
        {copyLabel}
      </button>
      {/* LiveRegion takes a `message` prop, not children, and holds the last
          announced string so an identical update is not re-announced. */}
      <LiveRegion message={message} />
    </div>
  )
}
