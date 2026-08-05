#!/usr/bin/env node
/**
 * `rm -rf`, portably.
 *
 * Both packages clear `dist/` before emitting, because neither `tsc` nor the
 * generators remove files that are no longer produced. Without it a stale
 * artefact survives every later build and eventually ships: the React package's
 * `dist/` was found carrying fourteen component directories from an earlier
 * build when the library had grown to eighteen.
 *
 * This exists rather than `rm -rf dist` in the script, which was the first
 * attempt: `rm` is not a command on Windows, so `pnpm build` failed outright
 * under cmd and PowerShell. Every other build step here is Node or tsc, so a
 * shell builtin was the only thing in the pipeline that assumed a platform.
 *
 * Paths are relative to the working directory, which is the package being
 * built, and one that escapes it is refused — this deletes recursively and
 * takes its target from argv, which is the same combination that made
 * verify-tarballs.mjs worth guarding.
 *
 * Usage: node ../../scripts/clean.mjs dist [more...]
 */
import { rmSync } from 'node:fs'
import { resolve, sep } from 'node:path'

const cwd = process.cwd()
const targets = process.argv.slice(2)

if (targets.length === 0) {
  console.error('usage: node scripts/clean.mjs <path> [path...]')
  process.exit(1)
}

for (const target of targets) {
  const path = resolve(cwd, target)

  if (path === cwd || !path.startsWith(`${cwd}${sep}`)) {
    console.error(`refusing to remove ${path} — it is not inside ${cwd}`)
    process.exit(1)
  }

  rmSync(path, { recursive: true, force: true })
}
