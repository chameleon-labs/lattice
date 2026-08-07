#!/usr/bin/env node
/**
 * Packs every publishable package, proves each tarball is consumable, and leaves
 * the archives in `.release/` for the release workflow to publish.
 *
 * Those are the bytes that ship: the release does not rebuild after verifying,
 * so nothing can change between the check and the publish.
 *
 * `pnpm pack` rather than `npm pack`, because only pnpm rewrites the
 * `workspace:` protocol into a real range; `npm publish` in the workflow rather
 * than `pnpm publish`, because only npm generates provenance. Each tool does the
 * half it can, and the tarball is the handover.
 *
 * Usage: node scripts/verify-tarballs.mjs [output-dir]
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

// The output directory is deleted before it is written, so where it points is a
// destructive decision taken from argv. `join` does not contain a `..` — it
// resolves it — so `verify-tarballs.mjs ../../..` would have recursively
// removed a directory well outside this repo. Refuse anything that is not
// strictly beneath the repo root, and refuse the root itself.
const outputDir = resolve(repoRoot, process.argv[2] ?? '.release')
if (outputDir === repoRoot || !outputDir.startsWith(`${repoRoot}${sep}`)) {
  console.error(`refusing to use ${outputDir} as the output directory — it must be inside ${repoRoot}`)
  process.exit(1)
}

const problems = []
const fail = (where, message) => problems.push(`${where}: ${message}`)

/** Anything that has no business in a consumer's node_modules. */
const FORBIDDEN = [
  { pattern: /\.stories\.[jt]sx?$/, why: 'a story would pull @storybook/react-vite into the module graph' },
  { pattern: /^package\/tests\//, why: 'test sources are not part of the published surface' },
  { pattern: /^package\/\.storybook\//, why: 'Storybook config is not part of the published surface' },
  { pattern: /^package\/(storybook-static|test-results|playwright-report)\//, why: 'build or run artefact' },
  { pattern: /^package\/node_modules\//, why: 'dependencies are resolved by the consumer, never shipped' },
  {
    pattern: /\.map$/,
    why: 'its sources are not published, so the map resolves to nothing — see packages/react/tsconfig.build.json'
  }
]

const exportTargets = (node) => {
  if (typeof node === 'string') return [node]
  if (node === null || typeof node !== 'object') return []
  return Object.values(node).flatMap(exportTargets)
}

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

const packagesDir = join(repoRoot, 'packages')
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const packed = []

for (const dir of packageDirs) {
  const packageRoot = join(packagesDir, dir)
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

  if (manifest.private === true) {
    console.log(`  skipped packages/${dir} — marked private`)
    continue
  }

  // Runs `prepack`, which is what builds dist/. A package whose build is broken
  // fails here rather than at publish.
  console.log(`\npacking ${manifest.name}…`)
  execFileSync('pnpm', ['pack', '--pack-destination', outputDir], {
    cwd: packageRoot,
    stdio: ['ignore', 'inherit', 'inherit']
  })

  const tarball = join(
    outputDir,
    `${manifest.name.replace(/^@/, '').replace(/\//g, '-')}-${manifest.version}.tgz`
  )
  const where = `${manifest.name} tarball`

  const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .split('\n')
    .filter((line) => line !== '' && !line.endsWith('/'))

  /** Byte length of one entry, read out of the archive rather than off disk. */
  const sizeOf = (path) =>
    execFileSync('tar', ['-xzOf', tarball, `package/${path}`], {
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024
    }).length

  const has = (path) => entries.includes(`package/${path}`)

  const required = ['package.json', 'README.md', 'LICENSE']
  for (const target of exportTargets(manifest.exports ?? {})) {
    if (!target.startsWith('./')) continue
    required.push(target.slice(2))
  }

  for (const path of [...new Set(required)]) {
    // `./fonts/*` and friends: the export is a directory contract, so the
    // requirement is "at least one file under here", not a specific name.
    if (path.includes('*')) {
      const prefix = `package/${path.slice(0, path.indexOf('*'))}`
      const matches = entries.filter((entry) => entry.startsWith(prefix))
      if (matches.length === 0) fail(where, `exports "./${path}" matched nothing`)
      else console.log(`    ok  ${path}  (${matches.length} files)`)
      continue
    }

    if (!has(path)) {
      fail(where, `missing ${path}`)
      continue
    }
    const size = sizeOf(path)
    if (size === 0) fail(where, `${path} is empty`)
    else console.log(`    ok  ${path}  (${size} bytes)`)
  }

  for (const entry of entries) {
    for (const { pattern, why } of FORBIDDEN) {
      if (pattern.test(entry)) fail(where, `${entry} should not ship — ${why}`)
    }
  }

  const packedManifest = execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], {
    encoding: 'utf8'
  })
  if (packedManifest.includes('workspace:')) {
    fail(where, 'a `workspace:` range survived into the packed manifest — the package is uninstallable')
  }
  if (JSON.parse(packedManifest).private === true) {
    fail(where, 'packed manifest is still `private: true`')
  }

  packed.push({ name: manifest.name, version: manifest.version, tarball, files: entries.length })
}

console.log('')
for (const { name, version, tarball, files } of packed) {
  console.log(`  ${name}@${version}  ${files} files  ${tarball.replace(`${repoRoot}/`, '')}`)
}

if (problems.length > 0) {
  console.error(`\n${problems.length} tarball problem(s):\n`)
  for (const problem of problems) console.error(`  ✗ ${problem}`)
  console.error('')
  process.exit(1)
}

if (packed.length === 0) {
  console.error('\nnothing was packed — every package is still private\n')
  process.exit(1)
}

console.log(`\nok: ${packed.length} tarball(s) verified and ready to publish`)
