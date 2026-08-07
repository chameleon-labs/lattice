/**
 * Extracted from the component stylesheets rather than designed ahead of them: a
 * draft `--lat-inset-sm|md|lg` failed on the first component written against it,
 * because two axes climbing one three-step scale collide at the top.
 *
 * Three families, each answering a different question:
 *
 * - **label** — room for a short label. Inline leads block by two steps at every
 *   rung, a short string reading as cramped long before a paragraph does.
 * - **row** — room for a row in a list. Inline leads by one, a row already being
 *   bounded by its siblings.
 * - **surface** — room a container gives its children. Symmetric.
 *
 * `label` and `row` are not neighbours on one scale — they encode a difference
 * in kind, which is what stops a menu item reaching for a button's inset.
 * `label` is named for what its consumers share, a short string needing
 * horizontal room, rather than for interactivity: two of the seven are headers.
 *
 * Values are primitive *names*, so a change to `SPACES` flows through.
 */
import type {SpaceName} from './layout.js';

export type {SpaceName};

/** A pair travels together: `[block, inline]`. A string is symmetric. */
export type InsetValue = readonly [SpaceName, SpaceName] | SpaceName;

export const INSET_ROLES = {
  'label-sm': ['1', '3'],
  'label-md': ['2', '4'],
  'label-lg': ['3', '5'],

  'row-sm': ['2', '3'],
  'row-md': ['3', '4'],

  /**
   * `lg` and `xl` are used once each. They exist anyway: the alternative —
   * snapping Dialog from space-6 to space-5 so a rung earns its place — changes
   * rendering to tidy a token table.
   */
  'surface-sm': '3',
  'surface-md': '4',
  'surface-lg': '5',
  'surface-xl': '6',
} as const satisfies Readonly<Record<string, InsetValue>>;

export type InsetRole = keyof typeof INSET_ROLES;

/**
 * Gaps are named by size, not purpose — unlike insets, the measurement showed
 * no purpose split to encode, and inventing one for symmetry would be a
 * distinction the system does not have.
 *
 * Stops at `space-4`. Larger gaps appear only in page layout, never in
 * component internals, and a role covering them would invite a component to
 * reach for a page-sized gap.
 */
export const GAP_ROLES = {
  xs: '1',
  sm: '2',
  md: '3',
  lg: '4',
} as const satisfies Readonly<Record<string, SpaceName>>;

export type GapRole = keyof typeof GAP_ROLES;
