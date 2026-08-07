import {describe, expect, it} from 'vitest';
import {SPACES} from '../config/layout.js';
import {GAP_ROLES, INSET_ROLES, type InsetRole, type InsetValue, type SpaceName} from '../config/spacing-roles.js';
import {SPACING_ROLE_COUNT, spacingRoleCss, spacingRoleTokens} from '../generate/spacing-roles.js';

describe('spacing roles', () => {
  it('names every inset by purpose, not by size alone', () => {
    for (const name of Object.keys(INSET_ROLES)) {
      expect(name).toMatch(/^(label|row|surface)-/);
    }
  });

  it('gives labels more inline inset than block, and rows less', () => {
    // The two series are the finding this vocabulary encodes: a short label needs
    // horizontal room for its label, a row is already bounded by its siblings.
    const lead = (role: InsetRole) => {
      const v: InsetValue = INSET_ROLES[role];
      if (!Array.isArray(v)) {throw new Error(`${role} is not a pair`);}
      const [block, inline] = v as readonly [SpaceName, SpaceName];
      return SPACES[inline].multiplier - SPACES[block].multiplier;
    };
    for (const role of ['label-sm', 'label-md', 'label-lg'] as const) {
      expect(lead(role)).toBe(2);
    }
    for (const role of ['row-sm', 'row-md'] as const) {expect(lead(role)).toBe(1);}
  });

  it('keeps every surface inset symmetric', () => {
    for (const [name, value] of Object.entries(INSET_ROLES)) {
      if (!name.startsWith('surface-')) {continue;}
      expect(Array.isArray(value)).toBe(false);
    }
  });

  it('orders the surface scale monotonically', () => {
    const sizes = (['surface-sm', 'surface-md', 'surface-lg', 'surface-xl'] as const).map(
      (r) => SPACES[INSET_ROLES[r]].multiplier,
    );
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(new Set(sizes).size).toBe(sizes.length);
  });

  it('references only primitives that exist', () => {
    const names = [
      ...Object.values(INSET_ROLES).flatMap((v) => (Array.isArray(v) ? v : [v])),
      ...Object.values(GAP_ROLES),
    ];
    for (const name of names) {expect(SPACES).toHaveProperty(name);}
  });
});

describe('the emitted spacing roles', () => {
  const css = spacingRoleCss();
  const declarations = css.split('\n').filter((line) => line.trim().startsWith('--lat-'));

  it('emits every role as a reference to a primitive, never a restated value', () => {
    // A role that inlines `0.5rem` silently detaches from the primitive it was
    // extracted from — the tier stops being a tier, and a change to SPACES
    // stops reaching it.
    expect(css).not.toMatch(/--lat-(inset|gap)-[a-z-]+:[^;]*[\d.]+rem/);
    expect(css).toContain('--lat-inset-label-md: var(--lat-space-2) var(--lat-space-4);');
    expect(css).toContain('--lat-inset-surface-xl: var(--lat-space-6);');
    expect(css).toContain('--lat-gap-md: var(--lat-space-3);');
  });

  it('emits one declaration per role and nothing else', () => {
    expect(declarations).toHaveLength(SPACING_ROLE_COUNT);
    expect(SPACING_ROLE_COUNT).toBe(Object.keys(INSET_ROLES).length + Object.keys(GAP_ROLES).length);
    expect(declarations).toHaveLength(css.split('\n').length);
  });

  it('writes a pair as block-then-inline, matching the CSS shorthand order', () => {
    // `padding: <block> <inline>` is the two-value shorthand's own order. Emitting
    // inline first would be silently wrong: it still parses, and every padded
    // the library would come out the wrong shape.
    for (const [role, value] of Object.entries(INSET_ROLES)) {
      if (!Array.isArray(value)) {continue;}
      const [block, inline] = value as readonly [string, string];
      expect(css).toContain(`--lat-inset-${role}: var(--lat-space-${block}) var(--lat-space-${inline});`);
    }
  });

  it('gives every CSS role a DTCG counterpart pointing at the same primitives', () => {
    // Structural rather than name-for-name: DTCG has no two-dimension type, so a
    // pair becomes a group of two dimensions. Walking every role rather than
    // spot-checking, so a missing rung fails here rather than in a snapshot.
    const tokens = spacingRoleTokens();

    for (const [role, value] of Object.entries(INSET_ROLES)) {
      const emitted = tokens.inset[role];
      expect(emitted, `inset.${role} is missing`).toBeDefined();
      if (Array.isArray(value)) {
        const [block, inline] = value as readonly [string, string];
        const pair = emitted as {block: {$value: string}; inline: {$value: string}};
        expect(pair.block.$value, `inset.${role}.block`).toBe(`{global.space.${block}}`);
        expect(pair.inline.$value, `inset.${role}.inline`).toBe(`{global.space.${inline}}`);
      } else {
        const single = emitted as {$value: string};
        expect(single.$value, `inset.${role}`).toBe(`{global.space.${value}}`);
      }
    }

    for (const [role, name] of Object.entries(GAP_ROLES)) {
      expect(tokens.gap[role]!.$value, `gap.${role}`).toBe(`{global.space.${name}}`);
    }
  });

  it('points every reference at a primitive that exists, in both artefacts', () => {
    // The CSS and the JSON name the same primitive in two syntaxes. A role that
    // pointed at `--lat-space-7` would emit happily and resolve to nothing.
    const referenced: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node !== 'object' || node === null) {return;}
      const record = node as Record<string, unknown>;
      const value = record['$value'];
      if (typeof value === 'string') {referenced.push(value);}
      else {for (const child of Object.values(record)) walk(child);}
    };
    walk(spacingRoleTokens());

    expect(referenced).toHaveLength(
      Object.values(INSET_ROLES).reduce<number>((n, v) => n + (Array.isArray(v) ? 2 : 1), 0) +
        Object.keys(GAP_ROLES).length,
    );
    for (const reference of referenced) {
      const name = reference.replace(/^\{global\.space\.|\}$/g, '');
      expect(SPACES, reference).toHaveProperty(name);
    }
    for (const name of css.match(/--lat-space-([\w-]+)\)/g) ?? []) {
      expect(SPACES, name).toHaveProperty(name.slice('--lat-space-'.length, -1));
    }
  });
});
