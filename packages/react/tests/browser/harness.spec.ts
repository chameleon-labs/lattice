import {expect, test} from '@playwright/test';
import {storyUrl} from './support/stories.js';

test('serves a story with both stylesheets applied', async ({page}) => {
  await page.goto(storyUrl('components-button--default', 'light'));

  await expect(page.getByRole('button', {name: 'Run audit'})).toBeVisible();

  // Proves the token stylesheet is actually loaded rather than merely imported:
  // an unresolved custom property computes to the empty string.
  const surface = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--lat-bg').trim(),
  );

  expect(surface).not.toBe('');
});

/**
 * The theme global has to *do* something, or half the accessibility sweep is
 * theatre.
 *
 * Every dark-mode scan reaches its story through `globals=theme:dark`. If that
 * parameter were ignored — a renamed global, a decorator that stopped reading
 * it — the dark half would scan light mode and pass, and nothing else in the
 * suite would notice. This is the one assertion standing between that failure
 * and a green run.
 */
test('the theme global changes what the story renders on', async ({page}) => {
  const surfaceIn = async (theme: 'light' | 'dark') => {
    await page.goto(storyUrl('components-button--default', theme));

    const story = page.locator('.lat-story');
    await story.waitFor();

    return {
      theme: await story.getAttribute('data-lat-theme'),
      background: await story.evaluate((el) => getComputedStyle(el).backgroundColor),
    };
  };

  const light = await surfaceIn('light');
  const dark = await surfaceIn('dark');

  expect(light.theme).toBe('light');
  expect(dark.theme).toBe('dark');

  // The attribute alone is not enough: `[data-lat-theme]` redefines the tokens
  // but paints nothing, so a decorator that set the attribute without a
  // background would give both themes the same surface — which is exactly the
  // defect the demo stylesheet hit.
  expect(dark.background).not.toBe(light.background);
});
