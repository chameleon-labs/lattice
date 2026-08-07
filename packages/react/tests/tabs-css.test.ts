/**
 * @vitest-environment node
 *
 * Assembled from source rather than read from dist/ — see stylesheet.test.ts.
 *
 * This file exists for the reason badge-severity-css.test.ts and
 * card-css.test.ts do: `stylesheet.test.ts`'s "references only tokens the
 * token package declares" only checks that a referenced var() name is
 * declared *somewhere* in the token package, not that a given rule reaches
 * for the *right* one, and no unit test in tabs.test.tsx evaluates CSS — it
 * only asserts `aria-selected` reflects the selected tab, never what that
 * attribute resolves to visually. `--lat-solid` and `--lat-border` (the
 * list's own hairline colour) are close enough in role that a copy-paste
 * from the hairline rule above would look plausible in review and be wrong:
 * a selected tab would be indistinguishable from an unselected one.
 */
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { assembleCss } from '../scripts/assemble-css.js'

const css = await assembleCss(fileURLToPath(new URL('../src/styles.css', import.meta.url)))

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function block(selector: string): string {
  const pattern = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`)
  const match = pattern.exec(css)
  if (match === null) {
    throw new Error(`no ${selector} block found in the assembled stylesheet`)
  }
  return match[1] ?? ''
}

describe("Tabs' stylesheet", () => {
  it("marks the selected tab's indicator with --lat-solid, not the list's own hairline colour", () => {
    const rule = block(".lat-tab[aria-selected='true']")

    expect(rule).toContain('border-bottom-color: var(--lat-solid);')
    expect(rule).not.toContain('var(--lat-border)')
  })
})
