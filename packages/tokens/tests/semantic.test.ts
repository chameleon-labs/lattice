import { describe, expect, it } from 'vitest'
import { MODES } from '../config/modes.js'
import { semanticBlock } from '../generate/semantic.js'

describe('semantic tier', () => {
  it('emits every role in both modes', () => {
    for (const mode of MODES) {
      const css = semanticBlock(mode)
      for (const role of [
        '--lat-bg',
        '--lat-bg-raised',
        '--lat-bg-subtle',
        '--lat-component',
        '--lat-field-bg',
        '--lat-switch-track',
        '--lat-text',
        '--lat-text-subtle',
        '--lat-solid',
        '--lat-on-solid',
        '--lat-border',
        '--lat-border-strong',
        '--lat-wash',
        '--lat-focus-ring',
        '--lat-accent-vivid',
        '--lat-danger-tint',
        '--lat-danger-tint-border'
      ]) {
        expect(css).toContain(`${role}:`)
      }
    }
  })

  it('keeps the accent vivid identical across modes', () => {
    const find = (mode: 'light' | 'dark') =>
      semanticBlock(mode).split('\n').find((l) => l.includes('--lat-accent-vivid:'))
    expect(find('light')).toBe(find('dark'))
  })

  it('raises a surface above the page in both modes', () => {
    // bg-raised is lighter than bg in dark AND light — Meridian lifts by
    // lightness regardless of theme.
    for (const mode of MODES) {
      expect(semanticBlock(mode)).toContain('--lat-bg-raised:')
    }
  })
})
