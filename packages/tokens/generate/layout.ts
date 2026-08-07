import {BREAKPOINTS, CONTAINERS, RADII, SPACES} from '../config/layout.js';

export interface DimensionToken {
  readonly $type: 'dimension';
  readonly $value: {
    readonly value: number;
    readonly unit: 'rem';
  };
}

export interface LayoutTokenGroups {
  readonly space: Readonly<Record<string, DimensionToken>>;
  readonly breakpoint: Readonly<Record<string, DimensionToken>>;
  readonly container: Readonly<Record<string, DimensionToken>>;
  readonly radius: Readonly<Record<string, DimensionToken>>;
}

export const LAYOUT_PRIMITIVE_COUNTS = {
  space: Object.keys(SPACES).length,
  breakpoint: Object.keys(BREAKPOINTS).length,
  container: Object.keys(CONTAINERS).length,
  radius: Object.keys(RADII).length,
} as const;

export const LAYOUT_PRIMITIVE_COUNT = Object.values(LAYOUT_PRIMITIVE_COUNTS).reduce((total, count) => total + count, 0);

const dimensionToken = (value: number): DimensionToken => ({
  $type: 'dimension',
  $value: {value, unit: 'rem'},
});

const dimensionGroup = (values: Readonly<Record<string, number>>): Readonly<Record<string, DimensionToken>> =>
  Object.fromEntries(Object.entries(values).map(([name, value]) => [name, dimensionToken(value)]));

const spaceValues = (): Readonly<Record<string, number>> =>
  Object.fromEntries(Object.entries(SPACES).map(([name, space]) => [name, space.rem]));

const cssGroup = (name: string, values: Readonly<Record<string, number>>): string =>
  Object.entries(values)
    .map(([token, value]) => `  --lat-${name}-${token}: ${value}rem;`)
    .join('\n');

export function layoutCss(): string {
  return [
    cssGroup('space', spaceValues()),
    cssGroup('breakpoint', BREAKPOINTS),
    cssGroup('container', CONTAINERS),
    cssGroup('radius', RADII),
  ].join('\n');
}

export function layoutTokens(): LayoutTokenGroups {
  return {
    space: dimensionGroup(spaceValues()),
    breakpoint: dimensionGroup(BREAKPOINTS),
    container: dimensionGroup(CONTAINERS),
    radius: dimensionGroup(RADII),
  };
}
