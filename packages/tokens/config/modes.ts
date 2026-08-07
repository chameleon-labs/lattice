/**
 * The two themes.
 *
 * Previously exported from `config/lightness.ts` alongside the shared lightness
 * curve. The curve is gone — Lattice's anchors do not sit on one — so the mode
 * list lives on its own rather than inside a file named for a thing that no
 * longer exists.
 */
export type Mode = 'light' | 'dark';

export const MODES: readonly Mode[] = ['light', 'dark'];
