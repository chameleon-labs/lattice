import type {Mode} from '../config/modes.js';
import {ROLE_ALIASES} from '../config/semantic.js';
import {formatOklch} from './format.js';
import {resolveAll, resolveAlpha, resolveTints} from './anchors.js';

/**
 * The semantic block for one mode: primitives, then the alpha tier, then the
 * role aliases that point at them.
 */
export function semanticBlock(mode: Mode): string {
  const primitives = resolveAll(mode)
    .map((s) => `  --lat-${s.scale}-${s.role}: ${formatOklch(s)};`)
    .join('\n');

  const alphas = [...resolveAlpha(mode), ...resolveTints(mode)].map((t) => `  --lat-${t.role}: ${t.value};`).join('\n');

  const roles = ROLE_ALIASES.map((a) => `  --lat-${a.role}: var(--lat-${a.source});`).join('\n');

  return [primitives, alphas, roles].join('\n\n');
}
