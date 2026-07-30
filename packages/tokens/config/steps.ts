/**
 * What each step is for.
 *
 * Adopted from Radix: a numbered scale whose numbers mean *jobs* makes contrast
 * structural rather than something re-checked per theme. These strings ship in
 * `tokens.json` so the contract travels with the tokens instead of living only in
 * the spec.
 */
export const STEP_JOBS: readonly string[] = [
  'app background',
  'subtle component background',
  'component background, rest',
  'component background, hover',
  'component background, active',
  'border, subtle',
  'border, interactive',
  'border, strong; focus ring',
  'solid fill',
  'solid fill, hover',
  'low-contrast text',
  'high-contrast text'
]

/** What each scale is for. */
export const SCALE_JOBS: Record<string, string> = {
  accent: 'Brand violet. Primary actions and emphasis.',
  gray: 'Neutral, faintly accent-tinted. Surfaces, borders and body text.',
  danger: 'Destructive actions and error states.',
  warning: 'Cautionary states needing attention but not blocking.',
  success: 'Confirmation and passing states.'
}
