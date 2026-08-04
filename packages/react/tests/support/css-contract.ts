// Static checks over the shipped stylesheet, expressed as pure functions so
// they can be proven against fixtures. A checker that only ever ran over the
// real file would pass vacuously while that file was empty, which is precisely
// when a contract most needs to be trustworthy.

const COMMENTS = /\/\*[\s\S]*?\*\//g

const stripComments = (css: string): string => css.replace(COMMENTS, '')

// Hex, every functional colour notation, and the named colours someone would
// plausibly type. The full 148-name CSS list is deliberately not enumerated:
// the rule exists to catch a hand-written value, not to be a CSS parser.
const NAMED = ['red', 'blue', 'green', 'black', 'white', 'gray', 'grey', 'orange', 'yellow']

// The dialog backdrop's scrim is the one colour literal this system permits —
// a fixed, mode-independent dim rather than a palette value, standing in for
// a role no token declares. dialog.css records the reason on the rule itself;
// this is the narrow allowance for it, not a general escape hatch. Everything
// else a stylesheet writes still gets flagged below.
const PERMITTED_COLOUR_LITERALS = new Set(['rgb(0 0 0 / 0.6)'])

export const findColourLiterals = (css: string): string[] => {
  const source = stripComments(css)
  const found: string[] = []

  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    found.push(match[0])
  }

  for (const match of source.matchAll(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/g)) {
    const value = match[0].replace(/\s+/g, ' ').trim()
    if (PERMITTED_COLOUR_LITERALS.has(value)) continue
    found.push(`${match[1]}(`)
  }

  for (const name of NAMED) {
    if (new RegExp(`:\\s*${name}\\s*(;|\\}|$)`, 'm').test(source)) {
      found.push(name)
    }
  }

  return found
}

export const findTokenReferences = (css: string): string[] => {
  const names = new Set<string>()

  for (const match of stripComments(css).matchAll(/var\(\s*(--lat-[a-z0-9-]+)/g)) {
    const name = match[1]
    if (name !== undefined) {
      names.add(name)
    }
  }

  return [...names]
}

export const findGlobalSelectors = (css: string): string[] =>
  [...stripComments(css).matchAll(/(^|\})\s*([^{}]*\*[^{}]*)\{/g)]
    .map((match) => (match[2] ?? '').trim())
    .filter((selector) => selector.length > 0)

export const findUnpausableAnimations = (css: string): string[] => {
  const found: string[] = []

  for (const match of stripComments(css).matchAll(/animation:\s*([^;}]+)/g)) {
    const value = (match[1] ?? '').trim()

    if (/\binfinite\b/.test(value)) {
      found.push(value)
      continue
    }

    for (const duration of value.matchAll(/(\d*\.?\d+)(ms|s)\b/g)) {
      const raw = Number(duration[1])
      const ms = duration[2] === 's' ? raw * 1000 : raw
      if (ms > 5000) {
        found.push(value)
        break
      }
    }
  }

  return found
}

// A static transform is a position, not motion — the switch thumb sits at its
// on-state offset under `reduce` exactly as it does otherwise. Only a
// *transitioned* transform moves an element over time, so only that is gated.
export const findAnimatedTransformsOutsideNoPreference = (css: string): string[] => {
  const source = stripComments(css)
  const found: string[] = []
  const noPreference = /@media[^{]*prefers-reduced-motion:\s*no-preference[^{]*\{/g
  const guarded: Array<[number, number]> = []

  for (const match of source.matchAll(noPreference)) {
    // RegExpMatchArray.index is optional in the lib types, so it must be
    // narrowed rather than used directly under this repo's strictness.
    const opensAt = match.index ?? 0
    let depth = 1
    let index = opensAt + match[0].length

    while (index < source.length && depth > 0) {
      const char = source[index]
      if (char === '{') depth += 1
      if (char === '}') depth -= 1
      index += 1
    }

    guarded.push([opensAt, index])
  }

  const isGuarded = (at: number): boolean =>
    guarded.some(([start, end]) => at >= start && at < end)

  for (const match of source.matchAll(/transition(-property)?:\s*([^;}]+)/g)) {
    if (!/\btransform\b/.test(match[2] ?? '')) continue
    if (isGuarded(match.index ?? 0)) continue
    found.push(match[0].trim())
  }

  return found
}

// Whether a *click* matches :focus-visible is the browser's heuristic, not
// something this system implements — so asserting that in a browser test would
// be measuring Firefox rather than Lattice. What Lattice controls is that the
// ring is scoped to :focus-visible — or, for a wrapper reacting to focus
// landing on a descendant control, :focus-within — and never to bare :focus,
// which is a property of the stylesheet and therefore deterministic.
//
// :focus-within is permitted alongside :focus-visible, not merely tolerated:
// unlike bare :focus, it isn't the "shows a ring on a mouse click" problem
// this check exists to catch on its own — see Input's wrapper (input.css),
// where a comment records why :focus-within is the correct choice there.
// The pattern below matches only a genuinely bare `:focus` — one not
// immediately followed by `-visible` or `-within` — rather than matching
// `:focus\b` broadly and subtracting `:focus-visible` back out, which is
// exactly the shape of bug that let `:focus-within` slip through as if it
// were bare `:focus` the first time this file was written.
export const findBareFocusOutlines = (css: string): string[] => {
  const found: string[] = []

  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (match[1] ?? '').trim()
    const body = match[2] ?? ''

    if (!/outline/.test(body)) continue
    if (!/:focus(?!-visible|-within)\b/.test(selector)) continue

    found.push(selector)
  }

  return found
}

// Only top-level declarations count. A block redeclared inside a media query is
// deliberate — Dialog and Menu add their entrance transform inside
// `prefers-reduced-motion: no-preference` — whereas the same block declared
// twice at top level is the copy-paste error this rule exists to catch.
export const findBlockSelectors = (css: string): string[] => {
  const source = stripComments(css)
  const found: string[] = []
  let depth = 0
  let index = 0

  while (index < source.length) {
    const char = source[index]

    if (char === '}') {
      depth -= 1
      index += 1
      continue
    }

    if (char === '{') {
      depth += 1
      index += 1
      continue
    }

    if (depth === 0) {
      const rest = source.slice(index)
      const match = /^\s*(\.lat-[a-z-]+)\s*\{/.exec(rest)

      if (match !== null && match[1] !== undefined) {
        found.push(match[1])
        index += match[0].length
        depth += 1
        continue
      }
    }

    index += 1
  }

  return found
}
