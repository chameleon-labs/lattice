/**
 * @vitest-environment node
 *
 * This file asserts on source files and the runtime module graph, not on the
 * DOM. It must not run under jsdom: there, the global URL resolves
 * `new URL(relative, import.meta.url)` against the document's base —
 * http://localhost:3000 — rather than the passed file: base, and readFileSync
 * then rejects the result.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as lattice from '../src/index.js'

const src = new URL('../src/', import.meta.url)
const barrel = readFileSync(new URL('index.ts', src), 'utf8')

/**
 * `pages/` is the one directory under src/ that is not a component family —
 * Phase 3 added it to hold full-page Storybook stories composed entirely from
 * the public API, plus the page-local icon set they draw on. Nothing in it is
 * meant to reach the barrel: a page story imports the library the way a
 * consumer would, through `../index.js`, so this directory's own exports
 * (`SystemPage`, the icon components) are deliberately private to it.
 */
const NON_COMPONENT_DIRECTORIES = ['pages']

/** Directories under src/ that hold a component, i.e. everything but the barrel. */
const componentDirectories = (): string[] =>
  readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !NON_COMPONENT_DIRECTORIES.includes(name))
    .sort()

/**
 * Every value a component family's own module exports at runtime — a
 * component function, or a provider re-exported straight from Ariakit — found
 * by actually importing the module rather than by parsing the barrel.
 *
 * That is what makes this discriminate rather than restate a list: a
 * component added to (or removed from) a family's `.tsx` file changes what
 * this returns automatically, with no second list here to fall out of step.
 */
const runtimeExportsOf = async (directory: string): Promise<string[]> => {
  const dirUrl = new URL(`${directory}/`, src)
  const componentFiles = readdirSync(dirUrl, { withFileTypes: true }).filter(
    (entry) =>
      entry.isFile() && entry.name.endsWith('.tsx') && !entry.name.endsWith('.stories.tsx')
  )

  const names: string[] = []
  for (const file of componentFiles) {
    const mod: Record<string, unknown> = await import(new URL(file.name, dirUrl).href)
    for (const [name, value] of Object.entries(mod)) {
      // Components and re-exported Ariakit providers are functions named in
      // PascalCase; anything else (a type) leaves no runtime binding to see.
      if (typeof value === 'function' && /^[A-Z]/.test(name)) names.push(name)
    }
  }
  return names
}

describe('public API', () => {
  it('finds the barrel and at least one component directory, so the assertions below are not vacuous', () => {
    expect(barrel.length).toBeGreaterThan(0)
    expect(componentDirectories().length).toBeGreaterThan(0)
  })

  it('exports every component family', () => {
    for (const name of [
      'Badge',
      'Button',
      'Callout',
      'Card',
      'CardBody',
      'CardHeader',
      'CodeBlock',
      'Dialog',
      'Disclosure',
      'Eyebrow',
      'Input',
      'LiveRegion',
      'Menu',
      'SegmentedControl',
      'SegmentedControlItem',
      'Stat',
      'Switch',
      'Table',
      'Tab',
      'TextField',
      'VisuallyHidden'
    ]) {
      expect(lattice).toHaveProperty(name)
    }
  })

  it('re-exports every value every family module defines, not just the families this file happens to name', async () => {
    const missing: string[] = []

    for (const directory of componentDirectories()) {
      for (const name of await runtimeExportsOf(directory)) {
        if (!(name in lattice)) missing.push(`${directory}: ${name}`)
      }
    }

    // A future task that adds a new component to an existing family's file,
    // or an entirely new family directory, fails here without anyone updating
    // a list in this file — the walk covers the filesystem, the barrel is
    // just what gets checked against it.
    expect(missing).toEqual([])
  })

  it('never re-exports a *Tone type — the axis Lattice retired', async () => {
    // Matches the identifier shape rather than naming ButtonTone, BadgeTone
    // and CalloutTone individually, so a *new* tone type reintroduced under
    // any name fails this too, not just the three the axis used to have.
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile(new URL('../src/index.ts', import.meta.url), 'utf8')
    )
    const toneTypes = [...source.matchAll(/\b([A-Z][A-Za-z]*Tone)\b/g)].map((match) => match[1])
    expect(toneTypes).toEqual([])
  })

  it('no longer exports the retired InputSize type', () => {
    expect(barrel).not.toContain('InputSize')
  })
})
