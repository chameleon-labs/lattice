import type {HTMLAttributes} from 'react';

/**
 * A code fragment inside running text. `CodeBlock` covers the standalone,
 * copyable listing; this is the inline half, and they are not one component
 * wearing a prop — a block owns a scroll container, a copy button and a live
 * region, while an inline fragment has to flow with the sentence and take part
 * in its line breaking.
 *
 * That breaking is the guarantee: a selector is one unbroken token as far as the
 * line-breaking algorithm is concerned, so without `overflow-wrap` it pushes its
 * container past the viewport — silently, and only at the widths where it
 * happens not to fit.
 *
 * No props: an inline fragment has no variants, and any colour a caller reached
 * for would be a status this component is not entitled to assert.
 */
export type CodeProps = HTMLAttributes<HTMLElement>;

export function Code({className, children, ...props}: CodeProps) {
  return (
    <code {...props} className={className === undefined ? 'lat-code' : `lat-code ${className}`}>
      {children}
    </code>
  );
}
