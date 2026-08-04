import { describe, expect, it } from 'vitest'
import { fontFaceCss } from '../generate/fonts.js'

describe('font faces', () => {
  it('declares both self-hosted families', () => {
    const css = fontFaceCss()
    expect(css).toContain("font-family: 'Instrument Sans';")
    expect(css).toContain("font-family: 'JetBrains Mono';")
    expect(css.match(/@font-face/g)).toHaveLength(2)
  })

  it('points at the fonts copied beside the stylesheet', () => {
    // Both land in dist/ — lattice.css at the root, the woff2 files in
    // dist/fonts/ — so a relative URL is what makes a consumer copying dist/
    // wholesale get working fonts with no build configuration.
    const css = fontFaceCss()
    expect(css).toContain("url('./fonts/InstrumentSans-Variable.woff2')")
    expect(css).toContain("url('./fonts/JetBrainsMono-Variable.woff2')")
  })

  it('swaps rather than blocking first paint', () => {
    expect(fontFaceCss().match(/font-display: swap;/g)).toHaveLength(2)
  })

  it('claims a width axis only for the font that has one', () => {
    // Instrument Sans carries wdth + wght; JetBrains Mono carries wght alone,
    // so a font-stretch range on the mono face would be a claim the font
    // cannot honour.
    const [, sans, mono] = fontFaceCss().split('@font-face')
    expect(sans).toContain('font-stretch:')
    expect(mono).not.toContain('font-stretch:')
  })
})
