import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {Ajv} from 'ajv';
import formatsPlugin from 'ajv-formats';
import {describe, expect, it} from 'vitest';

import {DTCG_SCHEMA, emitTokens} from '../generate/emit.js';

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
  readFileSync(fileURLToPath(new URL('fixtures/dtcg-format-2025.10.json', import.meta.url)), 'utf8'),
) as Record<string, unknown>;

const ajv = new Ajv({strict: false, allErrors: true});
// Not decoration: Ajv skips an unknown format rather than failing, so without
// this the schema's `uri-reference` and `json-pointer-uri-fragment` go
// unchecked. `.default` because ajv-formats is CommonJS. The last describe in
// this file fails if it is removed.
formatsPlugin.default(ajv);

const validate = ajv.compile(schema);
const tokens = emitTokens();

describe('tokens.json against the published DTCG schema', () => {
  it('validates', () => {
    const valid = validate(tokens);
    const errors = (validate.errors ?? [])
      .map((error) => `${error.instancePath || '(root)'} ${error.message}`)
      .slice(0, 10);

    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it('validates the version the artefact claims to be', () => {
    expect(schema.$id).toBe(DTCG_SCHEMA);
    expect(tokens.$schema).toBe(DTCG_SCHEMA);
  });

  // The semantic tier introduced a second shape for `$value` — a `{group.token}`
  // reference rather than a colour object. This is the assertion that makes the
  // schema check worth running on every commit rather than once by hand.
  it('accepts both value shapes the artefact emits', () => {
    const light = tokens['light'] as Record<string, Record<string, unknown>>;

    expect((light['gray']!['bg'] as {$value: unknown}).$value).toBeTypeOf('object');
    expect((light['role']!['text'] as {$value: unknown}).$value).toBe('{light.gray.text}');
  });

  it('accepts every typography primitive value shape', () => {
    const global = tokens['global'] as Record<string, Record<string, {$type?: string; $value: unknown}>>;

    expect(global['font']?.['sans']?.$value).toBeInstanceOf(Array);
    expect(global['font-size']?.['base']?.$value).toEqual({value: 1, unit: 'rem'});
    expect(global['line-height']?.['normal']?.$value).toBe(1.5);
    expect(global['letter-spacing']?.['normal']?.$value).toBe(0);
    expect(global['font-weight']?.['bold']?.$value).toBe(700);
    expect(global['space']?.['0-5']?.$value).toEqual({value: 0.125, unit: 'rem'});
    expect(global['breakpoint']?.['sm']?.$value).toEqual({value: 30, unit: 'rem'});
    expect(global['container']?.['prose']?.$value).toEqual({value: 42, unit: 'rem'});
    expect(global['radius']?.['full']?.$value).toEqual({value: 9999, unit: 'rem'});
    expect(global['duration']?.['default']?.$value).toEqual({value: 200, unit: 'ms'});
    expect(global['easing']?.['out']?.$value).toEqual([0, 0, 0.2, 1]);
    expect(global['container']).not.toHaveProperty('full');
    // `sm` is two stacked layers — SHADOWS carries them as data, and the DTCG
    // shadow value accepts either a bare object or a non-empty array, so this
    // is the array form with two entries.
    expect(global['shadow']?.['sm']?.$value as unknown[]).toHaveLength(2);
    expect(global['elevation']?.['raised']?.$value).toBe('{global.shadow.sm}');
    expect(global['text']?.['body']).toEqual({
      $type: 'typography',
      $value: {
        fontFamily: '{global.font.sans}',
        fontSize: '{global.font-size.base}',
        fontWeight: '{global.font-weight.regular}',
        letterSpacing: '{global.letter-spacing.normal}',
        lineHeight: '{global.line-height.normal}',
      },
    });
    expect(validate(tokens)).toBe(true);
  });

  it('rejects a shadow missing a required field', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>;
    global['shadow']!['2xl'] = {
      $type: 'shadow',
      $value: [
        {
          color: {colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.25},
          offsetX: {value: 0, unit: 'px'},
          offsetY: {value: 25, unit: 'px'},
          blur: {value: 50, unit: 'px'},
          // spread omitted — required by the shadowObject schema.
        },
      ],
    };

    expect(validate(broken)).toBe(false);
  });

  it('rejects a shadow dimension unit the format cannot represent', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>;
    const shadow = global['shadow']!['2xl'] as Record<string, unknown[]>;
    const layer = shadow['$value']![0] as Record<string, Record<string, unknown>>;
    layer['blur'] = {value: 50, unit: 'furlongs'};

    expect(validate(broken)).toBe(false);
  });

  it('rejects a typography composite missing a required property', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>;
    global['text'] = {
      body: {
        $type: 'typography',
        $value: {
          fontFamily: '{global.font.sans}',
          fontSize: '{global.font-size.base}',
          fontWeight: '{global.font-weight.regular}',
          letterSpacing: '{global.letter-spacing.normal}',
        },
      },
    };

    expect(validate(broken)).toBe(false);
  });

  it('rejects a token whose value is neither a colour nor a reference', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    const light = broken['light'] as Record<string, Record<string, Record<string, unknown>>>;
    light['gray']!['bg'] = {$type: 'color', $value: 42};

    expect(validate(broken)).toBe(false);
  });

  it('rejects a dimension unit the format cannot represent', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>;
    global['font-size']!['base'] = {
      $type: 'dimension',
      $value: {value: 1, unit: 'em'},
    };

    expect(validate(broken)).toBe(false);
  });

  it('rejects a duration unit the format cannot represent', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>;
    global['duration']!['default'] = {
      $type: 'duration',
      $value: {value: 200, unit: 'frames'},
    };

    expect(validate(broken)).toBe(false);
  });

  it('rejects a cubicBezier x coordinate outside the format range', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    const global = broken['global'] as Record<string, Record<string, Record<string, unknown>>>;
    global['easing']!['out'] = {
      $type: 'cubicBezier',
      $value: [1.1, 0, 0, 1],
    };

    expect(validate(broken)).toBe(false);
  });

  it('rejects a group name the format reserves', () => {
    const broken = structuredClone(tokens) as Record<string, unknown>;
    broken['$notAKnownProperty'] = {$type: 'color', $value: '{light.gray.bg}'};

    expect(validate(broken)).toBe(false);
  });
});

describe('the formats the schema declares are enforced, not skipped', () => {
  // logger silenced: its "unknown format ignored" warning is the noise this file removes.
  const withoutFormats = new Ajv({strict: false, allErrors: true, logger: false});

  const uriReference = {type: 'string', format: 'uri-reference'};
  const jsonPointer = (schema['definitions'] as Record<string, object>)['jsonPointerReference']!;

  it('rejects a $schema that is not a URI reference, and fails on the format keyword', () => {
    expect(validate({...tokens, $schema: 'not a uri reference'})).toBe(false);
    expect(validate.errors?.some((error) => error.keyword === 'format')).toBe(true);
  });

  it("rejects a pointer whose escape is invalid, which still satisfies the definition's ^#/ pattern", () => {
    expect(ajv.validate(jsonPointer, '#/invalid~escape')).toBe(false);
    expect(ajv.validate(jsonPointer, '#/valid/pointer')).toBe(true);
  });

  it('accepts both on an Ajv without the plugin, so the registration is what rejects them', () => {
    expect(withoutFormats.validate(uriReference, 'not a uri reference')).toBe(true);
    expect(withoutFormats.validate(jsonPointer, '#/invalid~escape')).toBe(true);
  });
});
