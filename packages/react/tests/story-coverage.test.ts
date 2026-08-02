/**
 * @vitest-environment node
 *
 * This file asserts on source files, not on the DOM. It must not run under
 * jsdom: there, the global URL resolves `new URL(relative, import.meta.url)`
 * against the document's base — http://localhost:3000 — rather than the passed
 * file: base, and readFileSync then rejects the result.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The other half of the accessibility guarantee.
 *
 * `tests/browser/a11y.spec.ts` scans every story Storybook indexes, which makes
 * coverage automatic for anything that *has* a story. It says nothing about a
 * component with none — that component is simply absent from the index, and
 * absence is exactly what a sweep cannot detect.
 *
 * So the sweep proves every story is accessible, and this proves every component
 * is a story. Neither is sufficient alone.
 */
const src = new URL('../src/', import.meta.url)

const barrel = readFileSync(new URL('index.ts', src), 'utf8')

const storyFiles = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter((entry) =>
  entry.endsWith('.stories.tsx')
)

const stories = storyFiles.map((file) => readFileSync(new URL(file, src), 'utf8')).join('\n')

/**
 * Value exports only.
 *
 * `export type { ButtonProps }` is a type and has nothing to render, so
 * demanding a story for it would force noise into the gallery. The barrel keeps
 * the two forms on separate statements, which is what makes this separable.
 */
const exportedComponents = (): string[] => {
  const names = new Set<string>()

  for (const match of barrel.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
    const clause = match[0]
    if (clause.startsWith('export type')) continue

    for (const name of (match[1] ?? '').split(',')) {
      const trimmed = name.trim().split(/\s+as\s+/).pop()?.trim()
      // `export { type Foo, Bar }` — an inline type specifier inside a value
      // clause is still a type.
      if (trimmed === undefined || trimmed === '' || trimmed.startsWith('type ')) continue
      names.add(trimmed)
    }
  }

  return [...names].sort()
}

/** Directories under src/ that hold a component, i.e. everything but the barrel. */
const componentDirectories = (): string[] =>
  readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

describe('story coverage', () => {
  it('finds the barrel and the stories, so the assertions below are not vacuous', () => {
    expect(exportedComponents().length).toBeGreaterThan(0)
    expect(storyFiles.length).toBeGreaterThan(0)
  })

  it('gives every component directory a stories file', () => {
    const without = componentDirectories().filter(
      (directory) => !storyFiles.some((file) => file.startsWith(`${directory}/`))
    )

    expect(without).toEqual([])
  })

  it('renders every exported component in at least one story', () => {
    const missing = exportedComponents().filter(
      (name) => !new RegExp(`\\b${name}\\b`).test(stories)
    )

    expect(missing).toEqual([])
  })

  it('titles every story file under the Components namespace', () => {
    const untitled = storyFiles.filter(
      (file) => !/title:\s*'Components\/\w+'/.test(readFileSync(new URL(file, src), 'utf8'))
    )

    // The browser sweep matches stories by `Components/<Family>`, so a story
    // titled anything else would be indexed, rendered, and never scanned.
    expect(untitled).toEqual([])
  })
})
