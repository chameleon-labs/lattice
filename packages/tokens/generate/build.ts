import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

/**
 * Build entrypoint. Emits the published artefacts — `dist/lattice.css` and
 * `dist/tokens.json` — from the token config.
 *
 * Scaffold only. The generator it will drive lands in #4 and the emit itself in
 * #5, so for now this prepares the output directory and writes nothing. It does
 * not invent token values: every colour in this package is computed from the
 * config or it does not exist.
 */
const dist = fileURLToPath(new URL('../dist/', import.meta.url))

await mkdir(dist, { recursive: true })

console.log('lattice: dist/ ready — no tokens to emit yet (generator #4, emit #5)')
