import {expect, test} from '@playwright/test';

test('the field value is set in mono', async ({page}) => {
  await page.goto('/iframe.html?id=components-textfield--default&globals=theme:dark');
  const family = await page
    .locator('.lat-input')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('JetBrains Mono');
});

test('the field label carries the panel tracking, not the section eyebrow one', async ({page}) => {
  await page.goto('/iframe.html?id=components-textfield--default&globals=theme:dark');
  const label = page.locator('.lat-text-field__label').first();
  expect(await label.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase');

  // As a ratio of the font size, because both projects run at different root
  // sizes and 0.1em resolves to 1px at 16px and 1.25px at 20px.
  const tracking = await label.evaluate((el) => {
    const style = getComputedStyle(el);
    return Number.parseFloat(style.letterSpacing) / Number.parseFloat(style.fontSize);
  });
  expect(tracking).toBeCloseTo(0.1, 3);
});
