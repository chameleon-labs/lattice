#!/usr/bin/env node
/**
 * Computes the next version and writes it to every publishable manifest.
 *
 * The two packages release in lockstep, so this reads one version, refuses if
 * they disagree, and writes one back — `npm version` run twice can drift, and
 * the drift only shows at publish time.
 *
 * Increments follow npm's own semantics, including the surprising one: `patch`
 * on a prerelease **graduates** it. `0.1.0-rc.1` + patch is `0.1.0`, not
 * `0.1.1` — the release being prepared *is* 0.1.0.
 *
 * No semver dependency: the workspace root installs nothing, and this runs
 * before `pnpm install` in the release path.
 *
 * Usage:
 *   node scripts/bump-version.mjs prerelease            # 0.1.0-rc.1 -> 0.1.0-rc.2
 *   node scripts/bump-version.mjs release               # 0.1.0-rc.1 -> 0.1.0
 *   node scripts/bump-version.mjs preminor --preid rc   # 0.1.0      -> 0.2.0-rc.0
 *   node scripts/bump-version.mjs minor --dry-run       # print only, write nothing
 *   node scripts/bump-version.mjs --self-test           # the arithmetic, checked
 */
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const BUMPS = [
  // Release exactly what the manifests already say. The first release needs it
  // — the version is set before anything is ever tagged, so bumping would skip
  // it — and so does re-cutting a version whose release failed before it
  // published anything.
  'current',
  'major',
  'minor',
  'patch',
  'premajor',
  'preminor',
  'prepatch',
  'prerelease',
  'release',
];

const args = process.argv.slice(2);
const selfTest = args.includes('--self-test');
const [bump] = args;
const dryRun = args.includes('--dry-run');
const preidIndex = args.indexOf('--preid');
const preid = preidIndex === -1 ? 'rc' : args[preidIndex + 1];

if (!selfTest && (bump === undefined || !BUMPS.includes(bump))) {
  console.error(`usage: node scripts/bump-version.mjs <${BUMPS.join('|')}> [--preid rc] [--dry-run]`);
  process.exit(1);
}

if (preid === undefined || !/^[0-9A-Za-z-]+$/.test(preid)) {
  console.error(`--preid must be a valid prerelease identifier, got ${JSON.stringify(preid)}`);
  process.exit(1);
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

const parse = (version) => {
  const match = SEMVER.exec(version);
  if (match === null) {
    throw new Error(`not a semver version: ${version}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] === undefined ? null : match[4].split('.'),
  };
};

const format = ({major, minor, patch, prerelease}) =>
  `${major}.${minor}.${patch}${prerelease === null ? '' : `-${prerelease.join('.')}`}`;

/** npm's rules, spelled out rather than inherited from a dependency. */
const next = (current, kind, identifier = preid) => {
  const v = parse(current);
  const isPre = v.prerelease !== null;

  switch (kind) {
    // Parsed and reformatted rather than passed through, so a malformed version
    // in a manifest is caught here rather than at `npm publish`.
    case 'current':
      return format(v);

    case 'release':
      if (!isPre) {
        throw new Error(`${current} is not a prerelease — nothing to graduate`);
      }
      return format({...v, prerelease: null});

    // A prerelease already sitting on the target version graduates rather than
    // moving: 0.1.0-rc.1 is a candidate *for* 0.1.0.
    case 'patch':
      return isPre ? format({...v, prerelease: null}) : format({...v, patch: v.patch + 1});

    case 'minor':
      return isPre && v.patch === 0
        ? format({...v, prerelease: null})
        : format({major: v.major, minor: v.minor + 1, patch: 0, prerelease: null});

    case 'major':
      return isPre && v.minor === 0 && v.patch === 0
        ? format({...v, prerelease: null})
        : format({major: v.major + 1, minor: 0, patch: 0, prerelease: null});

    case 'premajor':
      return format({major: v.major + 1, minor: 0, patch: 0, prerelease: [identifier, '0']});

    case 'preminor':
      return format({major: v.major, minor: v.minor + 1, patch: 0, prerelease: [identifier, '0']});

    case 'prepatch':
      return format({major: v.major, minor: v.minor, patch: v.patch + 1, prerelease: [identifier, '0']});

    case 'prerelease': {
      if (!isPre) {
        return format({...v, patch: v.patch + 1, prerelease: [identifier, '0']});
      }
      // A different identifier restarts the count: rc.3 -> beta.0, never beta.4.
      if (v.prerelease[0] !== identifier) {
        return format({...v, prerelease: [identifier, '0']});
      }
      const parts = [...v.prerelease];
      const lastNumeric = parts.map((part) => /^\d+$/.test(part)).lastIndexOf(true);
      if (lastNumeric === -1) {
        parts.push('0');
      } else {
        parts[lastNumeric] = String(Number(parts[lastNumeric]) + 1);
      }
      return format({...v, prerelease: parts});
    }

    default:
      throw new Error(`unknown bump: ${kind}`);
  }
};

// `--self-test` rather than a test file: the workspace root runs no test
// runner, and version arithmetic is not something to debug mid-release.
// CI runs this on every PR.
if (selfTest) {
  const cases = [
    ['0.1.0-rc.1', 'current', 'rc', '0.1.0-rc.1'],
    ['0.1.0', 'current', 'rc', '0.1.0'],
    ['0.1.0-rc.1', 'prerelease', 'rc', '0.1.0-rc.2'],
    ['0.1.0-rc.9', 'prerelease', 'rc', '0.1.0-rc.10'],
    ['0.1.0-rc.3', 'prerelease', 'beta', '0.1.0-beta.0'],
    ['0.1.0-rc.1', 'release', 'rc', '0.1.0'],
    ['0.1.0-rc.1', 'patch', 'rc', '0.1.0'],
    ['0.1.0-rc.1', 'minor', 'rc', '0.1.0'],
    ['0.1.0-rc.1', 'major', 'rc', '1.0.0'],
    ['1.0.0-rc.1', 'major', 'rc', '1.0.0'],
    ['0.1.1-rc.1', 'minor', 'rc', '0.2.0'],
    ['0.1.0', 'patch', 'rc', '0.1.1'],
    ['0.1.0', 'minor', 'rc', '0.2.0'],
    ['0.1.0', 'major', 'rc', '1.0.0'],
    ['0.1.0', 'prerelease', 'rc', '0.1.1-rc.0'],
    ['0.1.0', 'preminor', 'rc', '0.2.0-rc.0'],
    ['0.1.0', 'premajor', 'rc', '1.0.0-rc.0'],
    ['0.1.0', 'prepatch', 'rc', '0.1.1-rc.0'],
  ];

  let failed = 0;
  for (const [from, kind, identifier, expected] of cases) {
    let actual;
    try {
      actual = next(from, kind, identifier);
    } catch (error) {
      actual = `threw: ${error.message}`;
    }
    const ok = actual === expected;
    if (!ok) {
      failed += 1;
    }
    console.log(
      `  ${ok ? 'ok  ' : 'FAIL'} ${from.padEnd(12)} ${kind.padEnd(11)} ${identifier.padEnd(5)} -> ${actual}${ok ? '' : `  (expected ${expected})`}`,
    );
  }

  try {
    next('0.1.0', 'release');
    console.log('  FAIL 0.1.0        release           -> did not throw');
    failed += 1;
  } catch {
    console.log('  ok   0.1.0        release           -> refused, not a prerelease');
  }

  console.log(failed === 0 ? '\nok: version arithmetic' : `\n${failed} case(s) failed`);
  process.exit(failed === 0 ? 0 : 1);
}

const packagesDir = join(repoRoot, 'packages');
const manifests = readdirSync(packagesDir, {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesDir, entry.name, 'package.json'))
  .filter((path) => JSON.parse(readFileSync(path, 'utf8')).private !== true)
  .toSorted();

if (manifests.length === 0) {
  console.error('no publishable packages found');
  process.exit(1);
}

const current = [...new Set(manifests.map((path) => JSON.parse(readFileSync(path, 'utf8')).version))];
if (current.length > 1) {
  console.error(`packages disagree on the current version: ${current.join(', ')} — releases are lockstep`);
  process.exit(1);
}

const [from] = current;
const to = next(from, bump);

if (to === from) {
  // `current`, or a bump that resolved to the version already there. Writing
  // would be a no-op, and the "the rewrite changed nothing" check below would
  // read that no-op as a failed rewrite.
  console.log(`  ${manifests.length} manifest(s) already at ${to} — nothing to write`);
} else {
  for (const path of manifests) {
    const source = readFileSync(path, 'utf8');
    // A targeted rewrite of the version line rather than a JSON round-trip:
    // re-serialising would reformat and reorder a hand-maintained manifest, and
    // the diff of a release commit should be one line per package.
    const updated = source.replace(/^(\s*"version":\s*)"[^"]*"/m, (_match, prefix) => `${prefix}"${to}"`);
    if (updated === source) {
      console.error(`could not rewrite the version in ${path}`);
      process.exit(1);
    }
    if (!dryRun) {
      writeFileSync(path, updated);
    }
    console.log(`  ${dryRun ? 'would set' : 'set'} ${path.replace(`${repoRoot}/`, '')} to ${to}`);
  }
}

console.log(`\n${from} -> ${to}${to === from ? ' (unchanged)' : ''}`);

// Consumed by the cut-release workflow.
if (process.env.GITHUB_OUTPUT !== undefined && !dryRun) {
  writeFileSync(process.env.GITHUB_OUTPUT, `version=${to}\nprevious=${from}\n`, {flag: 'a'});
}
