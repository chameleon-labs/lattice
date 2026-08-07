#!/usr/bin/env node
/**
 * Release preflight. Static checks on the workspace manifests, run on every PR
 * and again — with the tag — at release.
 *
 * The failure it exists for: pnpm and npm both **skip a `private` package
 * silently**. `pnpm publish -r` prints "There are no new packages that should be
 * published" and exits 0, so a forgotten `private: true` looks exactly like a
 * successful release. The guard is weaker still in the path this repo uses — npm
 * was observed accepting `npm publish <tarball> --dry-run` for a manifest marked
 * private, since a tarball publish reads the manifest out of the archive. So
 * `private` is asserted here rather than relied on anywhere else.
 *
 * Usage:
 *   node scripts/check-release.mjs            # PR mode: shape only
 *   node scripts/check-release.mjs v0.1.0     # release mode: also match the tag
 */
import {readFileSync, readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const releaseTag = process.argv[2];

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

const readManifest = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** Every string value in an `exports` map, however deeply conditioned. */
const exportTargets = (node) => {
  if (typeof node === 'string') {
    return [node];
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  return Object.values(node).flatMap(exportTargets);
};

// The workspace root must stay private permanently. It is the one manifest a
// recursive publish could push by accident, and it has no dist to ship.
const root = readManifest(join(repoRoot, 'package.json'));
if (root.private !== true) {
  fail('package.json', 'the workspace root must keep `private: true` — it is never published');
}

const packagesDir = join(repoRoot, 'packages');
const packageDirs = readdirSync(packagesDir, {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (packageDirs.length === 0) {
  fail('packages/', 'no packages found');
}

const releases = [];

for (const dir of packageDirs) {
  const where = `packages/${dir}/package.json`;
  const manifest = readManifest(join(packagesDir, dir, 'package.json'));

  if (manifest.private === true) {
    fail(where, 'still marked `private: true` — publish would skip it and exit 0');
    continue;
  }

  releases.push({dir, manifest});

  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(manifest.version ?? '')) {
    fail(where, `version ${JSON.stringify(manifest.version)} is not a release version`);
  }

  // Required for a scoped package's first publish. As `publishConfig` rather
  // than a `--access public` flag, so it holds for a publish run by hand too.
  if (manifest.publishConfig?.access !== 'public') {
    fail(where, 'needs `publishConfig.access: "public"` — npm rejects a scoped first publish otherwise');
  }

  // `dist/` is gitignored, so the tarball is only ever correct because a build
  // ran first. `prepack` is the hook that guarantees it: `pnpm pack` and
  // `pnpm publish` both run it, where `prepublishOnly` does not run for `pack`
  // — and `pack` is what the release workflow calls.
  if (typeof manifest.scripts?.prepack !== 'string') {
    fail(where, 'needs a `prepack` script that builds — dist/ is gitignored and would ship empty');
  }

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    fail(where, 'needs a `files` allowlist');
  }

  if (manifest.repository?.directory !== `packages/${dir}`) {
    fail(where, `repository.directory should be "packages/${dir}" — provenance and npm both read it`);
  }

  // An `exports` entry pointing outside `files` resolves locally, where the
  // whole working tree is present, and 404s for the consumer.
  const roots = (manifest.files ?? []).filter((pattern) => !pattern.startsWith('!'));
  for (const target of exportTargets(manifest.exports ?? {})) {
    if (!target.startsWith('./')) {
      continue;
    }
    const relative = target.slice(2);
    if (relative === 'package.json') {
      continue;
    }
    const covered = roots.some((prefix) => relative === prefix || relative.startsWith(`${prefix.replace(/\/$/, '')}/`));
    if (!covered) {
      fail(where, `exports "${target}" is not covered by \`files\` — it would 404 for consumers`);
    }
  }
}

// A peer on another package in this workspace must be `workspace:*`, which pnpm
// publishes as the exact version.
//
// `workspace:^` was here first and was wrong. It publishes as a caret range, so
// `@chameleon-labs/lattice-react@0.1.0-rc.1` would have accepted
// `lattice-tokens@0.1.0` — a combination this project does not support and
// cannot detect at runtime, because a component stylesheet whose `var(--lat-*)`
// references have moved renders unstyled rather than throwing. The lockstep
// claim in the README is only true if the published range says so.
const workspaceNames = new Set(releases.map((release) => release.manifest.name));
for (const {dir, manifest} of releases) {
  for (const [name, range] of Object.entries(manifest.peerDependencies ?? {})) {
    if (!workspaceNames.has(name)) {
      continue;
    }
    if (range !== 'workspace:*') {
      fail(
        `packages/${dir}/package.json`,
        `peer on ${name} is ${JSON.stringify(range)} — must be "workspace:*", which publishes as an exact version`,
      );
    }
  }
}

// One version across the workspace, deliberately. The React package's
// stylesheets are `var(--lat-*)` references that resolve into the token
// package; a component release whose references outrun the tokens it is paired
// with renders unstyled rather than failing loudly. A shared version number
// makes the supported pair self-evident and removes the compatibility table
// that independent versioning would otherwise need.
const versions = [...new Set(releases.map((release) => release.manifest.version))];
if (versions.length > 1) {
  fail('workspace', `packages disagree on the version: ${versions.join(', ')} — releases are lockstep`);
}

if (releaseTag !== undefined) {
  if (!releaseTag.startsWith('v')) {
    fail('tag', `${releaseTag} does not look like a release tag (expected a leading "v")`);
  }
  const tagged = releaseTag.replace(/^v/, '');
  for (const {dir, manifest} of releases) {
    if (manifest.version !== tagged) {
      fail(
        `packages/${dir}/package.json`,
        `version ${manifest.version} does not match tag ${releaseTag} — bump the manifest or retag`,
      );
    }
  }
}

for (const {dir, manifest} of releases) {
  console.log(`  ${manifest.name.padEnd(34)} ${manifest.version.padEnd(12)} packages/${dir}`);
}

if (problems.length > 0) {
  console.error(`\n${problems.length} release precondition(s) failed:\n`);
  for (const problem of problems) {
    console.error(`  ✗ ${problem}`);
  }
  console.error('');
  process.exit(1);
}

console.log(
  `\nok: ${releases.length} package(s) publishable at ${versions[0]}${releaseTag === undefined ? '' : `, matching ${releaseTag}`}`,
);
