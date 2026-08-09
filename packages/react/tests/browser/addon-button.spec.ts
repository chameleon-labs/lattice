import {expect, test} from '@playwright/test';

test('the pressable box holds 24px at every size', async ({page}) => {
  await page.goto('/iframe.html?id=components-addonbutton--sizes&globals=theme:dark');
  await page.locator('.lat-addon-button').first().waitFor();

  const boxes = await page.locator('.lat-addon-button').evaluateAll((buttons) =>
    buttons.map((el) => {
      const rect = el.getBoundingClientRect();

      return {size: el.getAttribute('data-size'), width: rect.width, height: rect.height};
    }),
  );

  expect(boxes).toHaveLength(3);

  for (const box of boxes) {
    expect(box.width, `${box.size} width`).toBeGreaterThanOrEqual(24);
    expect(box.height, `${box.size} height`).toBeGreaterThanOrEqual(24);
  }
});

test('the icon steps with the size', async ({page}) => {
  await page.goto('/iframe.html?id=components-addonbutton--sizes&globals=theme:dark');
  await page.locator('.lat-addon-button').first().waitFor();

  const icons = await page
    .locator('.lat-addon-button > svg')
    .evaluateAll((svgs) => svgs.map((el) => el.getBoundingClientRect().width));

  expect(icons).toHaveLength(3);
  expect(icons[0]!).toBeLessThan(icons[1]!);
  expect(icons[1]!).toBeLessThan(icons[2]!);
});

test('the toggle changes its accessible name, not only its icon', async ({page}) => {
  await page.goto('/iframe.html?id=components-addonbutton--password-toggle&globals=theme:dark');

  const toggle = page.getByRole('button', {name: 'Show password'});
  await toggle.click();

  await expect(page.getByRole('button', {name: 'Hide password'})).toBeVisible();
});
