#!/usr/bin/env node
/**
 * `rm -rf`, portably. `rm` is not a command on Windows, and every other build
 * step is Node or tsc, so a shell builtin was the one thing in the pipeline that
 * assumed a platform.
 *
 * Both packages clear `dist/` before emitting because neither tsc nor the
 * generators remove files they no longer produce — the React package's `dist/`
 * was once found carrying fourteen component directories after the library had
 * grown to eighteen.
 *
 * A target that escapes the working directory is refused: this deletes
 * recursively and takes its path from argv.
 *
 * Usage: node ../../scripts/clean.mjs dist [more...]
 */
import { rmSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

const cwd = process.cwd()
const targets = process.argv.slice(2)

if (targets.length === 0) {
  // Reported as it was actually invoked. The callers are package manifests, so
  // the path is `../../scripts/clean.mjs` from there and `scripts/clean.mjs`
  // from the root — printing either one as a constant is wrong half the time,
  // and wrong in exactly the moment someone is already confused.
  const invoked = relative(cwd, process.argv[1]) || process.argv[1]
  console.error(`usage: node ${invoked} <path> [path...]`)
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
