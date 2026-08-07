/**
 * @vitest-environment node
 *
 * The caching in `tests/browser/support/stories.ts`, checked here rather than
 * left to be inferred from a green Playwright run.
 *
 * A memoised fetch is invisible when it works — the browser suite passes either
 * way, and passed for months while re-requesting the index once per test. The
 * only observable difference is how many requests reach the dev server, which
 * nothing in the browser suite asserts and nothing in a passing run reports.
 * So the behaviour is pinned here, against a stub, where the count is the thing
 * under test.
 *
 * `resetModules` before each case, because the cache is module state: without
 * it the second test would inherit the first test's resolved promise and pass
 * for the wrong reason.
 */
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {APIRequestContext} from '@playwright/test';

const INDEX = {
  entries: {
    'components-button--default': {
      id: 'components-button--default',
      title: 'Components/Button',
      name: 'Default',
      type: 'story',
    },
    'components-button--docs': {
      id: 'components-button--docs',
      title: 'Components/Button',
      name: 'Docs',
      type: 'docs',
    },
  },
};

/** Just enough of Playwright's request context for `fetchStories`. */
const stubRequest = (
  respond: () => Promise<{ok: () => boolean; status: () => number; json: () => Promise<unknown>}>,
) => {
  const get = vi.fn(respond);
  return {request: {get} as unknown as APIRequestContext, get};
};

const ok = (): Promise<{ok: () => boolean; status: () => number; json: () => Promise<unknown>}> =>
  Promise.resolve({
    ok: () => true,
    status: () => 200,
    json: () => Promise.resolve(INDEX),
  });

beforeEach(() => {
  vi.resetModules();
});

describe('the story index cache', () => {
  it('fetches the index once however many tests ask for it', async () => {
    const {fetchStories} = await import('./browser/support/stories.js');
    const {request, get} = stubRequest(ok);

    await fetchStories(request);
    await fetchStories(request);
    await fetchStories(request);

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('shares one request between callers that start together', async () => {
    const {fetchStories} = await import('./browser/support/stories.js');
    const {request, get} = stubRequest(ok);

    // Concurrent, not sequential: caching the resolved value rather than the
    // promise would let these race and issue three requests.
    await Promise.all([fetchStories(request), fetchStories(request), fetchStories(request)]);

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('drops `docs` entries, which are Storybook chrome rather than stories', async () => {
    const {fetchStories} = await import('./browser/support/stories.js');
    const {request} = stubRequest(ok);

    const stories = await fetchStories(request);

    expect(stories.map((story) => story.id)).toEqual(['components-button--default']);
  });

  /**
   * The failure this whole change exists for. One dropped socket cost a CI run;
   * caching the rejection would have cost every remaining test in the worker.
   */
  it('does not cache a failure — the next caller tries again', async () => {
    const {fetchStories} = await import('./browser/support/stories.js');

    let attempt = 0;
    const {request, get} = stubRequest(() => {
      attempt += 1;
      if (attempt === 1) {
        return Promise.reject(new Error('read ECONNRESET'));
      }
      return ok();
    });

    await expect(fetchStories(request)).rejects.toThrow('ECONNRESET');

    const stories = await fetchStories(request);

    expect(stories).toHaveLength(1);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('reports a non-ok response rather than parsing it', async () => {
    const {fetchStories} = await import('./browser/support/stories.js');
    const {request} = stubRequest(() =>
      Promise.resolve({
        ok: () => false,
        status: () => 503,
        json: () => Promise.resolve({}),
      }),
    );

    await expect(fetchStories(request)).rejects.toThrow('503');
  });
});
