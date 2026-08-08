import {expect, test} from '@playwright/test';

test('the field value is set in mono', async ({page}) => {
  await page.goto('/iframe.html?id=components-textfield--default&globals=theme:dark');
  const family = await page
    .locator('.lat-input')
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).toContain('JetBrains Mono');
});

test('the field label is an uppercase eyebrow', async ({page}) => {
  await page.goto('/iframe.html?id=components-textfield--default&globals=theme:dark');
  const label = page.locator('.lat-text-field__label').first();
  expect(await label.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase');
  expect(await label.evaluate((el) => getComputedStyle(el).letterSpacing)).not.toBe('normal');
});

test('a field and a button of the same size are the same height', async ({page}) => {
  await page.goto('/iframe.html?id=components-input--sizes&globals=theme:dark');
  await page.locator('.lat-input-field').first().waitFor();

  const rows = await page.locator('.lat-input-field').evaluateAll((fields) =>
    fields.map((field) => {
      const row = field.parentElement as HTMLElement;
      const button = row.querySelector('.lat-button') as HTMLElement;

      return {
        size: field.getAttribute('data-size'),
        field: field.getBoundingClientRect().height,
        button: button.getBoundingClientRect().height,
      };
    }),
  );

  expect(rows).toHaveLength(3);

  for (const row of rows) {
    expect(row.field, `${row.size} field vs button`).toBeCloseTo(row.button, 1);
  }

  expect(rows[0]!.field).toBeLessThan(rows[1]!.field);
  expect(rows[1]!.field).toBeLessThan(rows[2]!.field);
});

test('the field label steps with the control', async ({page}) => {
  await page.goto('/iframe.html?id=components-textfield--sizes&globals=theme:dark');
  await page.locator('.lat-text-field').first().waitFor();

  const sizes = await page
    .locator('.lat-text-field__label')
    .evaluateAll((labels) => labels.map((el) => Number.parseFloat(getComputedStyle(el).fontSize)));

  expect(sizes).toHaveLength(3);
  expect(sizes[0]!).toBeLessThan(sizes[1]!);
  expect(sizes[1]!).toBeLessThan(sizes[2]!);
});
