/**
 * @vitest-environment node
 *
 * Must not run under jsdom: there the global URL resolves
 * `new URL(relative, import.meta.url)` against the document's base rather than
 * the file, exactly as `stylesheet.test.ts` records.
 *
 * The contract issue #38 exists to establish: a component names what its
 * spacing is *for*, not how big it is.
 *
 * Nothing else enforces this. `stylesheet.test.ts` checks that every token a
 * component references is declared somewhere, which a raw `--lat-space-3`
 * satisfies perfectly well. Unit tests never evaluate CSS. So without this
 * file the extraction decays on the next component someone writes, and the
 * decay is invisible — the component renders correctly the whole time.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

/**
 * Placements that stay on primitives, with the reason recorded in the
 * stylesheet beside each one.
 *
 * This list is meant to stay at two. A third entry is a signal that the
 * vocabulary is wrong and should be revisited — a role nobody can use is worse
 * than no role — rather than a signal to add a fourth.
 */
const EXCEPTIONS: readonly { readonly selector: string; readonly because: string }[] = [
  {
    selector: '.lat-segmented-control__label',
    because: 'reproduces `py-1.5 px-4`; no rung sits at 1.5/4 and the nearest measured 4px short'
  },
  {
    selector: '.lat-menu',
    because: 'a track hugging its items, not a container giving its children room'
  }
]

/**
 * The proof pages are application layout that demonstrates the system, not
 * library components, and their rules routinely mix a covered rung with an
 * uncovered one in a single declaration. They ship in the same stylesheet, so
 * they are skipped by selector rather than by file.
 */
const PAGE_SELECTORS = ['.lat-page', '.landing-page', '.system-page']

interface Declaration {
  readonly selector: string
  readonly property: string
  readonly value: string
}

/**
 * Innermost rules only. An `@media` wrapper's body contains braces, so it
 * never matches, and its nested rules match individually — which is what we
 * want, since a responsive override is as much a component declaration as any
 * other.
 */
const declarations = (): Declaration[] => {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: Declaration[] = []
  for (const rule of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1]!.trim().replace(/\s+/g, ' ')
    if (!selector.includes('.lat-')) continue
    if (PAGE_SELECTORS.some((page) => selector.includes(page))) continue
    for (const declaration of rule[2]!.split(';')) {
      const [rawProperty, ...rest] = declaration.split(':')
      if (rest.length === 0) continue
      out.push({
        selector,
        property: rawProperty!.trim(),
        value: rest.join(':').trim()
      })
    }
  }
  return out
}

const SPACE = /var\(--lat-space-([\w-]+)\)/g
/** Same pattern without `/g`: `.test()` on a global regex is stateful. */
const HAS_SPACE = /var\(--lat-space-[\w-]+\)/

/** Rungs the gap roles cover. A larger gap has no role and must stay primitive. */
const COVERED_GAPS = new Set(['1', '2', '3', '4'])

const all = declarations()

describe('component spacing names its purpose', () => {
  it('finds rules to check at all', () => {
    // Guards the parser itself: a regex that silently matched nothing would
    // make every assertion below pass without examining a single declaration.
    expect(all.length).toBeGreaterThan(200)
    expect(all.some((d) => d.value.includes('--lat-inset-'))).toBe(true)
    expect(all.some((d) => d.value.includes('--lat-gap-'))).toBe(true)
  })

  it('uses an inset role wherever a role covers the shape', () => {
    // A `padding` shorthand built purely from space primitives is exactly what
    // the inset roles were extracted from. Longhands (`padding-block`,
    // `padding-inline`) and shapes mixing a literal — `padding: 0 var(--lat-
    // space-2)` — describe something no role names, and stay as they are.
    const offenders = all
      .filter((d) => d.property === 'padding')
      .filter((d) => {
        const refs = [...d.value.matchAll(SPACE)]
        return refs.length > 0 && refs.length === d.value.split(/\s+/).filter(Boolean).length
      })
      .filter((d) => !EXCEPTIONS.some((e) => d.selector === e.selector))
      .map((d) => `${d.selector} { padding: ${d.value} }`)

    expect(offenders).toEqual([])
  })

  it('uses a gap role for every rung the gap roles cover', () => {
    const offenders = all
      .filter((d) => ['gap', 'row-gap', 'column-gap'].includes(d.property))
      .filter((d) => {
        const refs = [...d.value.matchAll(SPACE)]
        return refs.length === 1 && COVERED_GAPS.has(refs[0]![1]!)
      })
      .filter((d) => !EXCEPTIONS.some((e) => d.selector === e.selector))
      .map((d) => `${d.selector} { ${d.property}: ${d.value} }`)

    expect(offenders).toEqual([])
  })

  it('keeps the exception list at exactly the two placements that earned it', () => {
    // If this fails because someone added an entry, the question to ask is
    // whether the vocabulary fits the components — not whether the list should
    // be longer.
    expect(EXCEPTIONS).toHaveLength(2)
    for (const { selector } of EXCEPTIONS) {
      const rules = all.filter((d) => d.selector === selector && d.property === 'padding')
      expect(rules.length, `${selector} no longer declares padding`).toBeGreaterThan(0)
      expect(
        rules.some((d) => HAS_SPACE.test(d.value)),
        `${selector} no longer needs its exception — remove it from the list`
      ).toBe(true)
    }
  })

  it('references only roles the token package actually emits', () => {
    // stylesheet.test.ts asserts this for every token; repeated here narrowly
    // so a typo in a role name fails in the file that owns the contract.
    const emitted = new Set(
      [...css.matchAll(/var\((--lat-(?:inset|gap)-[\w-]+)\)/g)].map((m) => m[1]!)
    )
    expect(emitted.size).toBeGreaterThan(0)
    for (const name of emitted) {
      expect(name).toMatch(/^--lat-(inset-(control|row|surface)-(sm|md|lg|xl)|gap-(xs|sm|md|lg))$/)
    }
  })
})
