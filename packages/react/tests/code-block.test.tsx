import {render, screen, waitFor} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {CodeBlock} from '../src/code-block/code-block.js';

// jsdom already defines `navigator.clipboard` as a getter-only accessor, so
// `Object.assign(navigator, { clipboard: … })` fails — silently, because the
// assignment is dropped rather than throwing. `defineProperty` with
// `configurable: true` replaces the accessor outright and can be re-stubbed
// test to test.
//
// It must run *after* `userEvent.setup()`, not before: `setup()` installs its
// own clipboard stub on `navigator.clipboard` for paste support, which would
// otherwise overwrite this one and leave `writeText` uncalled.
const stubClipboard = (writeText: ReturnType<typeof vi.fn>): void => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {writeText},
    configurable: true,
  });
};

describe('CodeBlock', () => {
  it('announces the copy rather than only changing an icon', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<CodeBlock code="--lat-solid" />);
    await user.click(screen.getByRole('button', {name: /copy/i}));

    expect(writeText).toHaveBeenCalledWith('--lat-solid');
    const status = await screen.findByRole('status');
    expect(status.textContent ?? '').toMatch(/copied/i);
  });

  it('keeps the live region out of the visual layout', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<CodeBlock code="--lat-solid" />);
    await user.click(screen.getByRole('button', {name: /copy/i}));

    const status = await screen.findByRole('status');

    // VisuallyHidden clips its child to a 1px rect rather than removing it, so
    // the announcement stays in the accessibility tree without the block of
    // text it used to render pushing the panel's content down.
    expect(status.parentElement?.style.getPropertyValue('clip-path')).toBe('inset(50%)');
    expect(status.parentElement?.style.position).toBe('absolute');
  });

  it('gives the button a copied state that clears itself, alongside the announcement', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<CodeBlock code="--lat-solid" />);
    const button = screen.getByRole('button', {name: /copy/i});

    expect('copied' in button.dataset).toBe(false);

    await user.click(button);

    await waitFor(() => expect('copied' in button.dataset).toBe(true));
    // The accessible name is the sighted label held stable — only the data
    // attribute (and the colour code-block.css keys off it) changes.
    expect(button.textContent).toBe('Copy code');

    await waitFor(() => expect('copied' in button.dataset).toBe(false), {timeout: 3000});
  });

  it('makes the scrollable code region reachable and nameable by keyboard', () => {
    render(<CodeBlock code="--lat-solid" />);

    // `region` + the label is what a screen-reader user hears on landing here;
    // `tabIndex` is what gets a keyboard-only user here in the first place —
    // `overflow-x: auto` (code-block.css) is otherwise reachable only by mouse
    // drag or by a screen reader's virtual cursor, not by Tab.
    const region = screen.getByRole('region', {name: 'Code sample'});
    expect(region.tagName).toBe('PRE');
    expect(region.tabIndex).toBe(0);
  });

  it('forwards a className onto the root element', () => {
    render(<CodeBlock code="--lat-solid" className="custom" />);

    // Same contract as Card/Stat: a consumer's class joins the component's
    // own, it does not replace it.
    const root = screen.getByRole('region', {name: 'Code sample'}).parentElement;
    expect(root?.className.split(' ')).toEqual(expect.arrayContaining(['lat-code-block', 'custom']));
  });

  it('re-announces a second copy of the same text rather than deduplicating it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<CodeBlock code="--lat-solid" />);
    const button = screen.getByRole('button', {name: /copy/i});
    const status = screen.getByRole('status');

    await user.click(button);
    await waitFor(() => expect(status.textContent ?? '').toMatch(/copied/i));

    // The message clears itself ~1.5s after the copy, in real time — this is
    // the state that makes a second, identical copy a genuine change (''  →
    // 'Copied to clipboard') rather than a no-op LiveRegion update the
    // component would otherwise deduplicate away.
    await waitFor(() => expect(status.textContent).toBe(''), {timeout: 3000});

    await user.click(button);
    await waitFor(() => expect(status.textContent ?? '').toMatch(/copied/i));
  }, 10000);
});
