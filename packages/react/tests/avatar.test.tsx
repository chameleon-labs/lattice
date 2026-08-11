import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Avatar, initialsFrom} from '../src/avatar/avatar.js';

describe('initialsFrom', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['ada lovelace', 'AL'],
    ['Ada Byron King Lovelace', 'AL'],
    ['Prince', 'P'],
    ['  Ada   Lovelace  ', 'AL'],
    ['', ''],
    ['   ', ''],
  ])('%s -> %s', (name, expected) => {
    expect(initialsFrom(name)).toBe(expected);
  });

  it('keeps an astral character whole', () => {
    expect(initialsFrom('𝒜da 𝓁ovelace')).toBe('𝒜𝓁'.toLocaleUpperCase());
  });
});

describe('Avatar', () => {
  it('names itself when it stands alone', () => {
    render(<Avatar name="Ada Lovelace" />);

    expect(screen.getByRole('img', {name: 'Ada Lovelace'})).toBeTruthy();
  });

  it('leaves the accessibility tree when decorative, so the name is announced once', () => {
    const {container} = render(<Avatar name="Ada Lovelace" decorative />);

    // The attribute itself: queryByRole alone also passes when aria-hidden is
    // dropped, because decorative already omits role="img".
    expect(container.querySelector('.lat-avatar')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders the image when there is one', () => {
    const {container} = render(<Avatar name="Ada Lovelace" src="/ada.png" />);

    expect(container.querySelector('.lat-avatar__image')?.getAttribute('src')).toBe('/ada.png');
  });

  // The guarantee: a src that is present but never paints must still fall back.
  it('drops to the initials when the image fails', () => {
    const {container} = render(<Avatar name="Ada Lovelace" src="/gone.png" />);
    const image = container.querySelector('.lat-avatar__image')!;

    fireEvent.error(image);

    expect(container.querySelector('.lat-avatar__image')).toBeNull();
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('never announces the image or the initials separately', () => {
    const {container} = render(<Avatar name="Ada Lovelace" src="/ada.png" />);

    expect(container.querySelector('.lat-avatar__image')?.getAttribute('alt')).toBe('');
    expect(container.querySelector('.lat-avatar__initials')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the initials until the image actually paints', () => {
    const {container} = render(<Avatar name="Ada Lovelace" src="/slow.png" />);
    const initials = container.querySelector('.lat-avatar__initials')!;

    expect(initials.hasAttribute('data-covered')).toBe(false);

    fireEvent.load(container.querySelector('.lat-avatar__image')!);

    expect(container.querySelector('.lat-avatar__initials')!.hasAttribute('data-covered')).toBe(true);
  });

  it('attempts a new src rather than inheriting the previous failure', () => {
    const {container, rerender} = render(<Avatar name="Ada Lovelace" src="/gone.png" />);
    fireEvent.error(container.querySelector('.lat-avatar__image')!);
    expect(container.querySelector('.lat-avatar__image')).toBeNull();

    rerender(<Avatar name="Ada Lovelace" src="/ada.png" />);

    expect(container.querySelector('.lat-avatar__image')?.getAttribute('src')).toBe('/ada.png');
  });

  it('takes an explicit override for the names the rule gets wrong', () => {
    render(<Avatar name="Vincent van Gogh" initials="VG" />);

    expect(screen.getByText('VG')).toBeTruthy();
  });
});
