import { describe, expect, it } from 'vitest'
import { resolveAlpha, resolveTints } from '../generate/anchors.js'

describe('alpha tier', () => {
  it('draws the dark hairline as white at 7%', () => {
    const border = resolveAlpha('dark').find((t) => t.role === 'border')!
    expect(border.value).toBe('rgb(255 255 255 / 0.07)')
  })

  it('draws the light hairline as black at 8%', () => {
    const border = resolveAlpha('light').find((t) => t.role === 'border')!
    expect(border.value).toBe('rgb(0 0 0 / 0.08)')
  })

  it('gives the accent a richer tint than the status scales', () => {
    const tints = resolveTints('dark')
    expect(tints.find((t) => t.role === 'accent-tint')!.value).toBe('rgb(207 242 58 / 0.15)')
    expect(tints.find((t) => t.role === 'accent-tint-border')!.value).toBe('rgb(207 242 58 / 0.25)')
    expect(tints.find((t) => t.role === 'danger-tint')!.value).toBe('rgb(255 77 106 / 0.1)')
    expect(tints.find((t) => t.role === 'danger-tint-border')!.value).toBe('rgb(255 77 106 / 0.2)')
  })

  it('emits a tint pair for every chromatic scale', () => {
    expect(resolveTints('light')).toHaveLength(12)
  })
})
