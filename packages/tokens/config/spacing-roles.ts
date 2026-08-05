/**
 * Semantic spacing roles — tier 2 of the spacing layer.
 *
 * Extracted from the component stylesheets rather than designed ahead of them,
 * because a draft that specified `--lat-inset-sm|md|lg` before any component
 * existed failed on the first one written against it: two axes climbing one
 * three-step scale collide at the top, and the largest size repeats a value.
 *
 * What the measurement showed instead is three families, each answering a
 * different question:
 *
 * - **label** — how much room an element gives a short label. Inline leads
 *   block by two steps at every rung, because a short string reads as cramped
 *   long before a paragraph does.
 * - **row** — how much room a row in a list gives its content. Inline leads by
 *   one, because a row is already bounded by its siblings.
 * - **surface** — how much room a container gives its children. Symmetric.
 *
 * The label/row split is the useful part: they are not neighbours on one
 * scale, they encode a difference in kind, and naming them by purpose is what
 * stops a menu item reaching for a button's inset.
 *
 * `label` was called `control` until the migration was already written, which
 * is when it became clear the name did not fit its own consumers: two of the
 * seven are headers rather than controls — `.lat-table__header` is a `<th>`
 * and `.lat-card__header` a `<div>` wrapping `.lat-card__label`. What every
 * consumer shares is a short label needing horizontal room, not interactivity.
 * The grouping was right and the name was wrong.
 *
 * Values are primitive *names*, not numbers, so a change to `SPACES` flows
 * through every role rather than being restated here.
 */
import type { SpaceName } from './layout.js'

export type { SpaceName }

/** A pair travels together: `[block, inline]`. A string is symmetric. */
export type InsetValue = readonly [SpaceName, SpaceName] | SpaceName

export const INSET_ROLES = {
  'label-sm': ['1', '3'],
  'label-md': ['2', '4'],
  'label-lg': ['3', '5'],

  'row-sm': ['2', '3'],
  'row-md': ['3', '4'],

  /**
   * Only `sm` and `md` repeat across the library; `lg` and `xl` are used once
   * each. They exist anyway because the alternative — snapping Dialog from
   * space-6 to space-5 so a rung earns its place — changes rendering to tidy a
   * token table. A single-use rung on an ordered scale is defensible in a way a
   * single-use pair would not be.
   */
  'surface-sm': '3',
  'surface-md': '4',
  'surface-lg': '5',
  'surface-xl': '6'
} as const satisfies Readonly<Record<string, InsetValue>>

export type InsetRole = keyof typeof INSET_ROLES

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
  lg: '4'
} as const satisfies Readonly<Record<string, SpaceName>>

export type GapRole = keyof typeof GAP_ROLES
