import type {Page} from '@playwright/test';

/**
 * Computed colours come back in the space they were authored — our tokens are
 * oklch(), so a browser returns oklch(...), not rgb(...). Asserting either
 * serialization is brittle. Painting the value onto a throwaway element and
 * reading it back through a canvas gives channels, which are what we actually
 * mean.
 */
export function channelsOf(page: Page, selector: string): Promise<{r: number; g: number; b: number}> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const colour = getComputedStyle(el).backgroundColor;
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return {r, g, b};
    });
}
