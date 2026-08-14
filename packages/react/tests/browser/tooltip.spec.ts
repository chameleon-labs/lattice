import {expect, test} from '@playwright/test';

const story = (id: string) => `/iframe.html?id=components-tooltip--${id}&globals=theme:dark`;

test('never becomes the name, and never claims to be announced', async ({page}) => {
  await page.goto(story('on-an-icon-button'));
  const trigger = page.getByRole('button', {name: 'Copy page URL'});
  await trigger.focus();
  await expect(page.getByRole('tooltip')).toBeVisible();

  const wiring = await trigger.evaluate((el) => ({
    labelledby: el.getAttribute('aria-labelledby'),
    describedby: el.getAttribute('aria-describedby'),
    name: el.getAttribute('aria-label'),
  }));

  // The trigger's own name survives, and the tooltip supplies neither name nor
  // description — see src/tooltip/README.md for why the text must exist elsewhere.
  expect(wiring.name).toBe('Copy page URL');
  expect(wiring.labelledby).toBeNull();
  expect(wiring.describedby).toBeNull();
});

// WCAG 1.4.13, all three parts.
test('dismisses on Escape while the pointer stays put', async ({page}) => {
  await page.goto(story('default'));
  // Opened by hover, because 1.4.13 is about content shown on hover: dismissing
  // it by moving the mouse away is exactly what the criterion forbids relying on.
  await page.getByRole('button', {name: 'Re-run audit'}).hover();
  await expect(page.getByRole('tooltip')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('tooltip')).toHaveCount(0);

  // Still hovered, so a tooltip that reopened on its own would fail here.
  await page.waitForTimeout(500);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('survives the pointer moving onto it', async ({page}) => {
  await page.goto(story('default'));
  await page.getByRole('button', {name: 'Re-run audit'}).hover();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();

  await tooltip.hover();
  await page.waitForTimeout(300);

  await expect(tooltip).toBeVisible();
});

test('does not time out while the trigger holds focus', async ({page}) => {
  await page.goto(story('default'));
  await page.getByRole('button', {name: 'Re-run audit'}).focus();
  await expect(page.getByRole('tooltip')).toBeVisible();

  await page.waitForTimeout(2500);

  await expect(page.getByRole('tooltip')).toBeVisible();
});

test('opens on a disabled trigger, where the explanation matters most', async ({page}) => {
  await page.goto(story('on-a-disabled-trigger'));
  await page.getByRole('button', {name: 'Re-run audit'}).focus();

  await expect(page.getByRole('tooltip')).toBeVisible();
});
