import { describe, expect, it } from 'vitest'
import { ELEVATION_ROLES, SHADOWS } from '../config/elevation.js'
import { elevationCss } from '../generate/elevation.js'

describe('elevation', () => {
  it('has four roles', () => {
    expect(Object.keys(ELEVATION_ROLES)).toEqual(['flat', 'raised', 'overlay', 'floating'])
  })

  it('gives flat no shadow at all', () => {
    expect(ELEVATION_ROLES.flat).toBe('none')
  })

  it("carries Meridian's 2xl for the floating role", () => {
    expect(SHADOWS['2xl']).toBe('0 25px 50px -12px rgb(0 0 0 / 0.25)')
  })

  it('emits one token per role', () => {
    const css = elevationCss()
    for (const role of Object.keys(ELEVATION_ROLES)) {
      expect(css).toContain(`--lat-elevation-${role}:`)
    }
  })
})
