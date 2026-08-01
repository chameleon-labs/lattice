import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

/**
 * Inlines every `@import` in the entry stylesheet, depth-first.
 *
 * Shared by the build and by the contract tests, deliberately. The tests used
 * to read `dist/styles.css`, which passed locally and failed from a clean tree:
 * CI runs `test` before `build`, so the file it was reading did not exist yet.
 * Assembling from source here removes the ordering dependency without weakening
 * anything — the tests check the same bytes the build writes, because both call
 * this function.
 *
 * CI still verifies that `dist/styles.css` exists and is non-empty after the
 * build, so a broken write is caught separately from a broken stylesheet.
 */
export async function assembleCss(entry: string): Promise<string> {
  const source = await readFile(entry, 'utf8')
  const parts: string[] = []

  for (const line of source.split('\n')) {
    const match = /^@import\s+'([^']+)';/.exec(line.trim())

    if (match === null || match[1] === undefined) {
      parts.push(line)
      continue
    }

    parts.push(await assembleCss(resolve(dirname(entry), match[1])))
  }

  return parts.join('\n')
}
