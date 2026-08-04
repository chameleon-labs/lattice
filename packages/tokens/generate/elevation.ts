import { ELEVATION_ROLES, SHADOWS } from '../config/elevation.js'

export const SHADOW_PRIMITIVE_COUNT = Object.keys(SHADOWS).length
export const ELEVATION_ROLE_COUNT = Object.keys(ELEVATION_ROLES).length

/**
 * Elevation tokens.
 *
 * Emitted once on `:root` rather than per theme. The prior system varied shadow
 * by mode; Meridian declares one set and uses it in both.
 */
export function elevationCss(): string {
  return [
    ...Object.entries(SHADOWS).map(([name, value]) => `  --lat-shadow-${name}: ${value};`),
    ...Object.entries(ELEVATION_ROLES).map(([role, value]) => `  --lat-elevation-${role}: ${value};`)
  ].join('\n')
}
