import { useEffect, useRef, useState } from 'react'

export interface LiveRegionProps {
  message: string
  politeness?: 'polite' | 'assertive'
}

/**
 * An announcement that does not repeat itself.
 *
 * #19 names the trap precisely: a live region updated on every poll is
 * unusable, which is itself the kind of bug this product exists to find. The
 * component holds the last announced string and leaves the DOM untouched when
 * the new one matches.
 *
 * React's diffing would usually make an identical update a no-op anyway. Doing
 * it explicitly makes the guarantee the component's rather than the renderer's,
 * and it is the guarantee that gets tested.
 *
 * The region is rendered empty from the first paint rather than being inserted
 * when the first message arrives. A live region added to the document at
 * announcement time is not reliably read: assistive technology has to be
 * observing the container before the content changes.
 *
 * `assertive` interrupts whatever the user is currently hearing. It is a last
 * resort — `polite` is the default for that reason.
 */
export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
  const [announced, setAnnounced] = useState('')
  const previous = useRef('')

  useEffect(() => {
    if (message === previous.current) return

    previous.current = message
    setAnnounced(message)
  }, [message])

  return (
    <div
      className="lat-live-region"
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
    >
      {announced}
    </div>
  )
}
