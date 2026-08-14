import {expect, test} from '@playwright/test';

// getByRole resolves through the accessibility tree, so this fails if the level
// reaches the DOM but not assistive technology — an <h5> the browser exposes as
// a generic, say, because the button swallowed it.
test('exposes the heading level it was given, not just the tag', async ({page}) => {
  await page.goto('/iframe.html?id=components-accordion--at-another-heading-level&globals=theme:dark');

  await expect(page.getByRole('heading', {level: 5, name: 'Nested under an h4'})).toBeVisible();
  await expect(page.getByRole('heading', {level: 3})).toHaveCount(0);
});

test('navigating by heading lands on the trigger', async ({page}) => {
  await page.goto('/iframe.html?id=components-accordion--default&globals=theme:dark');
  const heading = page.getByRole('heading', {level: 3, name: 'Colour contrast'});
  await expect(heading).toBeVisible();

  // The button is inside the heading, so its accessible name is the heading's.
  const trigger = page.getByRole('button', {name: 'Colour contrast'});
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  // The panel it names, rather than a text match that drifts with the copy.
  const panelId = await trigger.getAttribute('aria-controls');
  await expect(page.locator(`#${panelId}`)).toBeHidden();

  await trigger.click();

  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(`#${panelId}`)).toBeVisible();
});
