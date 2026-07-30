import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { Ajv } from 'ajv'
import { describe, expect, it } from 'vitest'

import { DTCG_SCHEMA, emitTokens } from '../generate/emit.js'
import { buildAllScales } from '../generate/scale.js'

/**
 * The published DTCG schema, vendored.
 *
 * Vendored rather than fetched so the suite stays offline and deterministic. It
 * is pinned to the same version the artefact's `$schema` points at, so going
 * stale is the correct behaviour: this validates against the version the file
 * claims to be, not against whatever the working group published since.
 *
 * The deployed schema is a self-contained bundle — every sub-schema is inlined
 * under `definitions`, keyed by its absolute `$id`. That matters, because the
 * sub-schema URLs it references (`format/token.json`, `format/values/color.json`
 * and fifteen others) all return 404. Resolving them is neither possible nor
 * necessary.
 */
const schema = JSON.parse(
  readFileSync(fileURLToPath(new URL('fixtures/dtcg-format-2025.10.json', import.meta.url)), 'utf8')
) as Record<string, unknown>

describe('tokens.json against the published DTCG schema', () => {
  const ajv = new Ajv({ strict: false, allErrors: true })
  const validate = ajv.compile(schema)
  const tokens = emitTokens(buildAllScales())

  it('validates', () => {
    const valid = validate(tokens)
    const errors = (validate.errors ?? [])
      .map((error) => `${error.instancePath || '(root)'} ${error.message}`)
      .slice(0, 10)

    expect(errors).toEqual([])
    expect(valid).toBe(true)
  })

  it('validates the version the artefact claims to be', () => {
    expect(schema.$id).toBe(DTCG_SCHEMA)
    expect(tokens.$schema).toBe(DTCG_SCHEMA)
  })

  // The semantic tier introduced a second shape for `$value` — a `{group.token}`
  // reference rather than a colour object. This is the assertion that makes the
  // schema check worth running on every commit rather than once by hand.
  it('accepts both value shapes the artefact emits', () => {
    const light = tokens['light'] as Record<string, Record<string, unknown>>

    expect((light['gray']?.['1'] as { $value: unknown }).$value).toBeTypeOf('object')
    expect((light['gray']?.['bg'] as { $value: unknown }).$value).toBe('{light.gray.1}')
  })

  it('accepts every typography primitive value shape', () => {
    const global = tokens['global'] as Record<string, Record<string, { $value: unknown }>>

    expect(global['font']?.['sans']?.$value).toBeInstanceOf(Array)
    expect(global['font-size']?.['base']?.$value).toEqual({ value: 1, unit: 'rem' })
    expect(global['line-height']?.['normal']?.$value).toBe(1.5)
    expect(global['font-weight']?.['bold']?.$value).toBe(700)
    expect(validate(tokens)).toBe(true)
  })

  it('rejects a token whose value is neither a colour nor a reference', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>
    const light = broken['light'] as Record<string, Record<string, Record<string, unknown>>>
    light['gray']!['1'] = { $type: 'color', $value: 42 }

    expect(validate(broken)).toBe(false)
  })

  it('rejects a dimension unit the format cannot represent', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>
    global['font-size']!['base'] = {
      $type: 'dimension',
      $value: { value: 1, unit: 'em' }
    }

    expect(validate(broken)).toBe(false)
  })

  it('rejects a group name the format reserves', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>
    broken['$notAKnownProperty'] = { $type: 'color', $value: '{light.gray.1}' }

    expect(validate(broken)).toBe(false)
  })
})
