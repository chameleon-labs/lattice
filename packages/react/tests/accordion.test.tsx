import {render, screen} from '@testing-library/react';
import {userEvent} from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {Accordion, AccordionItem} from '../src/accordion/accordion.js';

const setup = (props: {single?: boolean} = {}) =>
  render(
    <Accordion headingLevel={3} {...props}>
      <AccordionItem label="Colour contrast">Thirteen nodes fail.</AccordionItem>
      <AccordionItem label="Landmarks">Two regions share a name.</AccordionItem>
    </Accordion>,
  );

describe('Accordion', () => {
  it('renders each header at the level it was given', () => {
    setup();

    expect(screen.getAllByRole('heading', {level: 3})).toHaveLength(2);
  });

  it('puts the button inside the heading, so navigating by heading lands on the text', () => {
    setup();
    const heading = screen.getAllByRole('heading', {level: 3})[0]!;

    expect(heading.querySelector('button')).not.toBeNull();
    expect(screen.getByRole('button', {name: 'Colour contrast'}).tagName).toBe('BUTTON');
  });

  it('carries the expanded state on the button, not the heading', async () => {
    setup();
    const trigger = screen.getByRole('button', {name: 'Colour contrast'});

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getAllByRole('heading', {level: 3})[0]!.hasAttribute('aria-expanded')).toBe(false);

    await userEvent.click(trigger);

    expect(screen.getByRole('button', {name: 'Colour contrast'}).getAttribute('aria-expanded')).toBe('true');
  });

  it('associates the panel with its header', async () => {
    setup();
    const trigger = screen.getByRole('button', {name: 'Colour contrast'});
    await userEvent.click(trigger);

    const controls = trigger.getAttribute('aria-controls');

    expect(controls).not.toBeNull();
    expect(document.getElementById(controls!)?.textContent).toBe('Thirteen nodes fail.');
  });

  it('leaves panels independent by default', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', {name: 'Colour contrast'}));
    await userEvent.click(screen.getByRole('button', {name: 'Landmarks'}));

    expect(screen.getByRole('button', {name: 'Colour contrast'}).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', {name: 'Landmarks'}).getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the others when single', async () => {
    setup({single: true});

    await userEvent.click(screen.getByRole('button', {name: 'Colour contrast'}));
    await userEvent.click(screen.getByRole('button', {name: 'Landmarks'}));

    expect(screen.getByRole('button', {name: 'Colour contrast'}).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', {name: 'Landmarks'}).getAttribute('aria-expanded')).toBe('true');
  });

  it('refuses to render an item outside an Accordion', () => {
    expect(() => render(<AccordionItem label="Orphan">content</AccordionItem>)).toThrow(
      /must be rendered inside an Accordion/,
    );
  });
});
