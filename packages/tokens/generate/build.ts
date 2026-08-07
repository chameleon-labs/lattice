import {cp, mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

import {MODES} from '../config/modes.js';
import {allPairsCap, buildCategorical, ordinalRange, validateCategorical, validateSequential} from './charts.js';
import {emitCss, emitTokens} from './emit.js';
import {buildLedger, formatLedger} from './report.js';
import {buildSeverity} from './severity.js';

/**
 * Build entrypoint. Emits `dist/lattice.css`, `dist/tokens.json` and
 * `dist/contrast-ledger.json`.
 *
 * It does not gate: Lattice's values are the identity and several documented
 * pairs miss WCAG, so every pair is measured and printed instead — see
 * generate/report.ts.
 *
 * The ledger is that measurement as data. `packages/react`'s a11y sweep reads it
 * to tell a documented, accepted deficiency from a new defect, so emitting it
 * here means the accepted set is generated from this package's own numbers
 * rather than hand-copied into the react package and left to drift.
 */
const MARKERS = {pass: '    ', warn: 'WARN', fail: 'FAIL'} as const;

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
await mkdir(dist, {recursive: true});

const ledger = buildLedger();
const failed = ledger.filter((e) => !e.passes);

console.log('lattice: generated identity, %d modes', MODES.length);

console.log('\nContrast ledger (reported, never gates):');
console.log(formatLedger(ledger));
console.log(
  '\n  %d of %d pairs miss their minimum. These ship — see docs/superpowers/specs/2026-08-03-lattice-identity-design.md §9.',
  failed.length,
  ledger.length,
);

console.log('\nSeverity ramp:');
for (const mode of MODES) {
  for (const swatch of buildSeverity(mode)) {
    console.log('  %s  %s  %s  (%s)', mode.padEnd(5), swatch.role.padEnd(9), swatch.hex, swatch.origin);
  }
}
console.log('  usage rule: colour never carries severity alone — icon and label are mandatory');

console.log('\nChart palettes:');
for (const mode of MODES) {
  const categorical = validateCategorical(buildCategorical(mode), mode);
  const ordinal = validateSequential(ordinalRange(mode), mode);
  for (const report of [categorical, ordinal]) {
    for (const check of report.checks) {
      const marker = MARKERS[check.state];
      console.log('  %s %s  %s  %s', marker, mode.padEnd(5), check.name.padEnd(20), check.detail);
    }
  }
}
console.log('  all-pairs cap: %d slots', allPairsCap(MODES));

const css = emitCss();
const tokens = `${JSON.stringify(emitTokens(), null, 2)}\n`;
// The full ledger, passes and failures alike — a consumer deriving an
// accepted set from this needs to see what passes too, so that a colour
// which starts failing tomorrow is a new failing entry rather than a colour
// silently absent from the file.
const ledgerJson = `${JSON.stringify(ledger, null, 2)}\n`;

// `dist` is a filesystem path, so it is joined as one. Interpolating it back into
// a `file:` URL would treat `#` and `?` in any parent directory name as a fragment
// or query and silently truncate the path — writing lattice.css somewhere else
// entirely, with no error.
const fontsSource = fileURLToPath(new URL('../assets/fonts/', import.meta.url));
await cp(fontsSource, join(dist, 'fonts'), {recursive: true});

await writeFile(join(dist, 'lattice.css'), css, 'utf8');
await writeFile(join(dist, 'tokens.json'), tokens, 'utf8');
await writeFile(join(dist, 'contrast-ledger.json'), ledgerJson, 'utf8');

// Byte length, not string length: the header's em dash is one UTF-16 code unit
// and three UTF-8 bytes, so `.length` under-reports what was actually written.
console.log(
  '\nlattice: wrote dist/lattice.css (%d bytes), dist/tokens.json (%d bytes) and ' +
    'dist/contrast-ledger.json (%d bytes)',
  Buffer.byteLength(css, 'utf8'),
  Buffer.byteLength(tokens, 'utf8'),
  Buffer.byteLength(ledgerJson, 'utf8'),
);
