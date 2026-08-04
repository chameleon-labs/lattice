import { cp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MODES } from '../config/modes.js'
import { allPairsCap, buildCategorical, ordinalRange, validateCategorical, validateSequential } from './charts.js'
import { emitCss, emitTokens } from './emit.js'
import { buildLedger, formatLedger } from './report.js'
import { buildSeverity } from './severity.js'

/**
 * Build entrypoint. Emits `dist/lattice.css` and `dist/tokens.json`.
 *
 * This build does not gate. Meridian's values are the identity, and four of its
 * documented pairs miss WCAG; refusing to write them would refuse to ship the
 * design. Every pair is still measured and printed — see generate/report.ts.
 */
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
await mkdir(dist, { recursive: true })

const ledger = buildLedger()
const failed = ledger.filter((e) => !e.passes)

console.log('lattice: Meridian identity, %d modes', MODES.length)

console.log('\nContrast ledger (reported, never gates):')
console.log(formatLedger(ledger))
console.log(
  '\n  %d of %d pairs miss their minimum. These ship — see docs/superpowers/specs/2026-08-03-meridian-identity-design.md §9.',
  failed.length,
  ledger.length
)

console.log('\nSeverity ramp:')
for (const mode of MODES) {
  for (const swatch of buildSeverity(mode)) {
    console.log('  %s  %s  %s  (%s)', mode.padEnd(5), swatch.role.padEnd(9), swatch.hex, swatch.origin)
  }
}
console.log('  usage rule: colour never carries severity alone — icon and label are mandatory')

console.log('\nChart palettes:')
for (const mode of MODES) {
  const categorical = validateCategorical(buildCategorical(mode), mode)
  const ordinal = validateSequential(ordinalRange(mode), mode)
  for (const report of [categorical, ordinal]) {
    for (const check of report.checks) {
      const marker = check.state === 'pass' ? '    ' : check.state === 'warn' ? 'WARN' : 'FAIL'
      console.log('  %s %s  %s  %s', marker, mode.padEnd(5), check.name.padEnd(20), check.detail)
    }
  }
}
console.log('  all-pairs cap: %d slots', allPairsCap(MODES))

const css = emitCss()
const tokens = `${JSON.stringify(emitTokens(), null, 2)}\n`

// `dist` is a filesystem path, so it is joined as one. Interpolating it back into
// a `file:` URL would treat `#` and `?` in any parent directory name as a fragment
// or query and silently truncate the path — writing lattice.css somewhere else
// entirely, with no error.
const fontsSource = fileURLToPath(new URL('../assets/fonts/', import.meta.url))
await cp(fontsSource, join(dist, 'fonts'), { recursive: true })

await writeFile(join(dist, 'lattice.css'), css, 'utf8')
await writeFile(join(dist, 'tokens.json'), tokens, 'utf8')

// Byte length, not string length: the header's em dash is one UTF-16 code unit
// and three UTF-8 bytes, so `.length` under-reports what was actually written.
console.log(
  '\nlattice: wrote dist/lattice.css (%d bytes) and dist/tokens.json (%d bytes)',
  Buffer.byteLength(css, 'utf8'),
  Buffer.byteLength(tokens, 'utf8')
)
