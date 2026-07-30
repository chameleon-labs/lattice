import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { buildAllScales } from './scale.js'

/**
 * Build entrypoint. Emits the published artefacts — `dist/lattice.css` and
 * `dist/tokens.json` — from the token config.
 *
 * The generator runs here and its contracts gate the build: a scale that cannot
 * meet its minimum ratio stops this process rather than shipping. Emitting the
 * artefacts themselves lands in #5, so for now this generates, verifies and
 * reports, and writes no files. It does not invent token values: every colour in
 * this package is computed from the config or it does not exist.
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

if (failures.length > 0) {
  console.error('\nlattice: contract failures')
  for (const failure of failures) {
    console.error('  %s', failure)
  }
  process.exit(1)
}

console.log('\nlattice: all contracts met — no tokens to emit yet (emit #5)')
