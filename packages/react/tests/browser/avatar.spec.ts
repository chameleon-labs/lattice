import {expect, test} from '@playwright/test';

test('a src that 404s falls back to the initials', async ({page}) => {
  await page.goto('/iframe.html?id=components-avatar--broken-image&globals=theme:dark');
  const avatar = page.locator('.lat-avatar');
  await avatar.waitFor();

  await expect(avatar.locator('.lat-avatar__initials')).toBeVisible();
  await expect(avatar.locator('.lat-avatar__image')).toHaveCount(0);
});

test('a src that is blocked outright falls back too', async ({page}) => {
  await page.route('**/*.png', (route) => route.abort());
  await page.goto('/iframe.html?id=components-avatar--broken-image&globals=theme:dark');
  const avatar = page.locator('.lat-avatar');
  await avatar.waitFor();

  await expect(avatar.locator('.lat-avatar__image')).toHaveCount(0);
  await expect(avatar.locator('.lat-avatar__initials')).toHaveText('AL');
});

test('a working image covers the initials rather than replacing them', async ({page}) => {
  await page.goto('/iframe.html?id=components-avatar--with-image&globals=theme:dark');
  const avatar = page.locator('.lat-avatar');
  await avatar.waitFor();

  const image = avatar.locator('.lat-avatar__image');
  await expect(image).toBeVisible();

  // The image fills the avatar and encloses the initials, so it hides them
  // rather than sitting beside them.
  const boxes = await avatar.evaluate((el) => {
    const initials = el.querySelector('.lat-avatar__initials') as HTMLElement;
    const img = el.querySelector('.lat-avatar__image') as HTMLElement;

    return {
      initials: initials.getBoundingClientRect().toJSON(),
      image: img.getBoundingClientRect().toJSON(),
      avatar: el.getBoundingClientRect().toJSON(),
    };
  });

  expect(boxes.image.width).toBeCloseTo(boxes.avatar.width, 0);
  expect(boxes.image.height).toBeCloseTo(boxes.avatar.height, 0);

  expect(boxes.image.left).toBeLessThanOrEqual(boxes.initials.left);
  expect(boxes.image.right).toBeGreaterThanOrEqual(boxes.initials.right);
  expect(boxes.image.top).toBeLessThanOrEqual(boxes.initials.top);
  expect(boxes.image.bottom).toBeGreaterThanOrEqual(boxes.initials.bottom);
});
