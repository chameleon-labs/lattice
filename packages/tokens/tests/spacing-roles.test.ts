import { describe, expect, it } from 'vitest'
import { SPACES } from '../config/layout.js'
import { GAP_ROLES, INSET_ROLES } from '../config/spacing-roles.js'

describe('spacing roles', () => {
  it('names every inset by purpose, not by size alone', () => {
    for (const name of Object.keys(INSET_ROLES)) {
      expect(name).toMatch(/^(control|row|surface)-/)
    }
  })

  it('gives controls more inline inset than block, and rows less', () => {
    // The two series are the finding this vocabulary encodes: a control needs
    // horizontal room for its label, a row is already bounded by its siblings.
    const lead = (role: string) => {
      const v = INSET_ROLES[role]!
      if (!Array.isArray(v)) throw new Error(`${role} is not a pair`)
      const [block, inline] = v
      return SPACES[inline]!.multiplier - SPACES[block]!.multiplier
    }
    for (const role of ['control-sm', 'control-md', 'control-lg']) expect(lead(role)).toBe(2)
    for (const role of ['row-sm', 'row-md']) expect(lead(role)).toBe(1)
  })

  it('keeps every surface inset symmetric', () => {
    for (const [name, value] of Object.entries(INSET_ROLES)) {
      if (!name.startsWith('surface-')) continue
      expect(Array.isArray(value)).toBe(false)
    }
  })

  it('orders the surface scale monotonically', () => {
    const sizes = ['surface-sm', 'surface-md', 'surface-lg', 'surface-xl']
      .map((r) => SPACES[INSET_ROLES[r] as string]!.multiplier)
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    expect(new Set(sizes).size).toBe(sizes.length)
  })

  it('references only primitives that exist', () => {
    const names = [
      ...Object.values(INSET_ROLES).flatMap((v) => (Array.isArray(v) ? v : [v])),
      ...Object.values(GAP_ROLES)
    ]
    for (const name of names) expect(SPACES).toHaveProperty(name)
  })
})
