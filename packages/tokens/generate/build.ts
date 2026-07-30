import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MODES } from '../config/lightness.js'
import {
  allPairsCap,
  buildCategorical,
  ordinalRange,
  validateCategorical,
  validateSequential
} from './charts.js'
import { emitCss, emitTokens } from './emit.js'
import { buildAllScales } from './scale.js'
import { buildSeverity, validateSeverity } from './severity.js'

/**
 * Build entrypoint. Emits the published artefacts — `dist/lattice.css` and
 * `dist/tokens.json` — from the token config.
 *
 * The generator runs here and its contracts gate the build: a scale that cannot
 * meet its minimum ratio stops this process before anything is written, so a
 * failing palette cannot reach `dist/`. It does not invent token values: every
 * colour in this package is computed from the config or it does not exist.
 */
const dist = fileURLToPath(new URL('../dist/', import.meta.url))

await mkdir(dist, { recursive: true })

const scales = buildAllScales()
const failures: string[] = scales.flatMap((scale) =>
  scale.contracts
    .filter((contract) => !contract.passes)
    .map(
      (contract) =>
        `${scale.name} ${scale.mode}: step ${contract.step} on step ${contract.reference} ` +
        `reached ${contract.ratio.toFixed(2)}:1, below the required ${contract.minimum}:1`
    )
)

console.log('lattice: generated %d scale-modes', scales.length)

for (const scale of scales) {
  const contracts = scale.contracts
    .map((contract) => `${contract.step}/${contract.reference} ${contract.ratio.toFixed(2)}`)
    .join('  ')
  const corrected = scale.solved.length > 0 ? `  solved ${scale.solved.join(',')}` : ''

  console.log(
    '  %s  %s  %s  on-solid %s %s%s',
    scale.name.padEnd(8),
    scale.mode.padEnd(5),
    contracts,
    scale.onSolid.text.padEnd(5),
    scale.onSolid.ratio.toFixed(2),
    corrected
  )
}

// APCA is reported and never gated on, so it is shown beside the gate rather
// than folded into it.
console.log('\nAPCA Lc (advisory, never gates):')
for (const scale of scales) {
  const advisory = scale.contracts
    .map((contract) => `${contract.step}/${contract.reference} ${contract.apcaLc.toFixed(1)}`)
    .join('  ')

  console.log('  %s  %s  %s', scale.name.padEnd(8), scale.mode.padEnd(5), advisory)
}

// The chart palettes carry their own checks. A warn is a documented conditional
// — the palette is legal with a secondary encoding such as direct labels — so it
// is reported and does not stop the build. A fail does.
console.log('\nChart palettes:')
for (const mode of MODES) {
  const categorical = validateCategorical(buildCategorical(mode), mode)
  const ordinal = validateSequential(ordinalRange(mode), mode)

  for (const report of [categorical, ordinal]) {
    for (const check of report.checks) {
      const marker = check.state === 'pass' ? '    ' : check.state === 'warn' ? 'WARN' : 'FAIL'
      console.log('  %s %s  %s  %s', marker, mode.padEnd(5), check.name.padEnd(20), check.detail)
      if (check.state === 'fail') {
        failures.push(`${mode} chart palette: ${check.name} — ${check.detail}`)
      }
    }
  }
}
console.log('  all-pairs cap: %d slots', allPairsCap(MODES))

// The severity ramp. Its greyscale check warns rather than fails in dark mode,
// because dark trades that cue away deliberately — see config/severity.ts.
console.log('\nSeverity ramp:')
for (const mode of MODES) {
  for (const check of validateSeverity(buildSeverity(mode), mode).checks) {
    const marker = check.state === 'pass' ? '    ' : check.state === 'warn' ? 'WARN' : 'FAIL'
    console.log('  %s %s  %s  %s', marker, mode.padEnd(5), check.name.padEnd(20), check.detail)
    if (check.state === 'fail') {
      failures.push(`${mode} severity ramp: ${check.name} — ${check.detail}`)
    }
  }
}
console.log('  usage rule: colour never carries severity alone — icon and label are mandatory')

// Nothing is written while a contract is unmet: a stale dist/ is a better
// outcome than one carrying a palette that fails its own gate.
if (failures.length > 0) {
  console.error('\nlattice: contract failures — nothing written')
  for (const failure of failures) {
    console.error('  %s', failure)
  }
  process.exit(1)
}

const css = emitCss(scales)
const tokens = `${JSON.stringify(emitTokens(scales), null, 2)}\n`

// `dist` is a filesystem path, so it is joined as one. Interpolating it back into
// a `file:` URL would treat `#` and `?` in any parent directory name as a fragment
// or query and silently truncate the path — writing lattice.css somewhere else
// entirely, with no error.
await writeFile(join(dist, 'lattice.css'), css, 'utf8')
await writeFile(join(dist, 'tokens.json'), tokens, 'utf8')

// Byte length, not string length: the header's em dash is one UTF-16 code unit
// and three UTF-8 bytes, so `.length` under-reports what was actually written.
console.log(
  '\nlattice: wrote dist/lattice.css (%d bytes) and dist/tokens.json (%d bytes)',
  Buffer.byteLength(css, 'utf8'),
  Buffer.byteLength(tokens, 'utf8')
)
