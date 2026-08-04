import { describe, expect, it } from 'vitest'
import { ELEVATION_ROLES, SHADOWS } from '../config/elevation.js'
import { elevationCss, elevationTokens } from '../generate/elevation.js'

describe('elevation', () => {
  it('has four roles', () => {
    expect(Object.keys(ELEVATION_ROLES)).toEqual(['flat', 'raised', 'overlay', 'floating'])
  })

  it('gives flat no shadow at all', () => {
    expect(ELEVATION_ROLES.flat).toBe('none')
  })

  it("carries Lattice's 2xl for the floating role", () => {
    // SHADOWS stores layers as data (Finding 2, Task 11) rather than a CSS
    // string, so the stylesheet and the DTCG token are both derived from the
    // same source rather than one being a hand-maintained copy of the other.
    expect(SHADOWS['2xl']).toEqual([{ offsetX: 0, offsetY: 25, blur: 50, spread: -12, alpha: 0.25 }])
    expect(elevationCss()).toContain('--lat-shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);')
  })

  it('emits one token per role', () => {
    const css = elevationCss()
    for (const role of Object.keys(ELEVATION_ROLES)) {
      expect(css).toContain(`--lat-elevation-${role}:`)
    }
  })

  it('renders a multi-layer shadow as comma-separated CSS layers', () => {
    // sm and lg are each two stacked layers.
    expect(elevationCss()).toContain(
      '--lat-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);'
    )
  })

  it('emits a DTCG shadow token per shadow, with layers matching the CSS', () => {
    const { shadow } = elevationTokens()
    expect(shadow['2xl'].$value).toHaveLength(1)
    expect(shadow.sm.$value).toHaveLength(2)
    expect(shadow.sm.$value[0]).toEqual({
      color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.1, hex: '#000000' },
      offsetX: { value: 0, unit: 'px' },
      offsetY: { value: 1, unit: 'px' },
      blur: { value: 3, unit: 'px' },
      spread: { value: 0, unit: 'px' }
    })
  })

  it('aliases every non-flat role to its shadow, and omits flat entirely', () => {
    const { elevation } = elevationTokens()
    expect(elevation['raised']?.$value).toBe('{global.shadow.sm}')
    expect(elevation['overlay']?.$value).toBe('{global.shadow.lg}')
    expect(elevation['floating']?.$value).toBe('{global.shadow.2xl}')
    expect(elevation).not.toHaveProperty('flat')
  })
})
