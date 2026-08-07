import {expect, test} from '@playwright/test';
import {channelsOf} from './support/colour.js';

const page1 = '/iframe.html?id=components-button--variants';

test('a story with no theme global renders dark', async ({page}) => {
  await page.goto(page1);
  const theme = await page.locator('.lat-surface').first().getAttribute('data-lat-theme');
  expect(theme).toBe('dark');
});

test('the light global re-themes the surface', async ({page}) => {
  await page.goto(`${page1}&globals=theme:light`);
  // oklch(0.957 0.0107 286.2) -> #f0f0f8. getComputedStyle returns the colour
  // in the space it was authored (oklch), so comparing against an rgb()
  // string is brittle — channelsOf resolves either serialization to channels
  // through a canvas, and the ±2 tolerance absorbs oklch -> sRGB rounding.
  const {r, g, b} = await channelsOf(page, '.lat-surface');
  expect(Math.abs(r - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(g - 240)).toBeLessThanOrEqual(2);
  expect(Math.abs(b - 248)).toBeLessThanOrEqual(2);
});

test('stat values use tabular figures', async ({page}) => {
  await page.goto('/iframe.html?id=pages-landing--dark');
  const variant = await page
    .locator('.lat-stat__value')
    .first()
    .evaluate((el) => getComputedStyle(el).fontVariantNumeric);
  expect(variant).toContain('tabular-nums');
});
