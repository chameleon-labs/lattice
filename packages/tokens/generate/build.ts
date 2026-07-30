import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { emitCss, emitTokens } from './emit.js'
import { buildAllScales } from './scale.js'

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
const failures = scales.flatMap((scale) =>
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

await writeFile(new URL('lattice.css', `file://${dist}`), css, 'utf8')
await writeFile(new URL('tokens.json', `file://${dist}`), tokens, 'utf8')

console.log(
  '\nlattice: wrote dist/lattice.css (%d bytes) and dist/tokens.json (%d bytes)',
  css.length,
  tokens.length
)
