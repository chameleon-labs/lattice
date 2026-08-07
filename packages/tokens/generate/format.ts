/**
 * Value formatting, shared by the emitters.
 *
 * Lives apart from `emit.ts` so `semantic.ts` can format a swatch without
 * importing the module that imports it.
 */
import type {Swatch} from './anchors.js';

/**
 * Decimal places kept in an emitted colour. Six round-trips every anchor
 * exactly, so the colour a browser computes is the colour whose contrast was
 * measured.
 */
const PLACES = 6;

function trim(value: number): string {
  return String(Number(value.toFixed(PLACES)));
}

/** A swatch as a CSS `oklch()` value. */
export function formatOklch(swatch: Pick<Swatch, 'l' | 'c' | 'h'>): string {
  return `oklch(${trim(swatch.l)} ${trim(swatch.c)} ${trim(swatch.h)})`;
}
