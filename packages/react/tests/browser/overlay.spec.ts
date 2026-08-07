import {expect, test} from '@playwright/test';

test('the dialog backdrop actually dims the page', async ({page}) => {
  await page.goto('/iframe.html?id=components-dialog--open&globals=theme:light');
  const backdrop = page.locator('.lat-dialog__backdrop').first();
  const colour = await backdrop.evaluate((el) => getComputedStyle(el).backgroundColor);
  // The superseded Quiet Surface spec found this rendering as 80% of near-white
  // over near-white — a scrim present in the markup and absent in the render.
  const [r, g, b] = colour.match(/\d+/g)!.map(Number);
  expect((r! + g! + b!) / 3).toBeLessThan(120);
});

test('a menu carries a real border, not only a shadow', async ({page}) => {
  await page.goto('/iframe.html?id=components-menu--open&globals=theme:dark');
  const width = await page
    .locator('.lat-menu')
    .first()
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(width).toBe('1px');
});
