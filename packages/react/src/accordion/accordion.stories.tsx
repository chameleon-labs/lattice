import type {Meta, StoryObj} from '@storybook/react-vite';
import {Accordion, AccordionItem} from './accordion.js';

/**
 * A set of panels whose headers are real headings. `headingLevel` is required:
 * a screen reader navigates an accordion by heading, and the right level is a
 * document-outline decision only the page can make.
 */
const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  // `children` is required on the component, so the meta has to satisfy it; every
  // story below supplies its own through `render`.
  args: {headingLevel: 3, children: null},
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem label="Colour contrast">
        Thirteen nodes fail the 4.5:1 minimum for normal text. Each is listed with the measured ratio and the pair of
        colours that produced it.
      </AccordionItem>
      <AccordionItem label="Landmarks">
        Two regions share a role and a name, so neither can be told apart.
      </AccordionItem>
      <AccordionItem label="Form labels">Every control on this page has an accessible name.</AccordionItem>
    </Accordion>
  ),
};

export const OneOpenToStart: Story = {
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem label="Colour contrast" defaultOpen>
        Open on arrival, so the sweep scans an expanded panel rather than only collapsed headers.
      </AccordionItem>
      <AccordionItem label="Landmarks">Two regions share a role and a name.</AccordionItem>
    </Accordion>
  ),
};

/** `single` closes the others. Off by default: collapsing a panel the reader opened is a surprise. */
export const OneAtATime: Story = {
  render: (args) => (
    <Accordion {...args} single>
      <AccordionItem label="Colour contrast">Thirteen nodes fail the 4.5:1 minimum.</AccordionItem>
      <AccordionItem label="Landmarks">Two regions share a role and a name.</AccordionItem>
      <AccordionItem label="Form labels">Every control has an accessible name.</AccordionItem>
    </Accordion>
  ),
};

/** A level the page's outline needs, rather than the one that looked right in isolation. */
export const AtAnotherHeadingLevel: Story = {
  args: {headingLevel: 5},
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem label="Nested under an h4">
        Rendered as an h5, because that is what the outline asked for.
      </AccordionItem>
    </Accordion>
  ),
};

/** A panel long enough to overflow, so long-content layout and scrolling are reviewable. */
export const LongPanel: Story = {
  render: (args) => (
    <div style={{maxBlockSize: '14rem', overflowY: 'auto'}}>
      <Accordion {...args}>
        <AccordionItem label="Colour contrast" defaultOpen>
          {Array.from({length: 8}, (_, index) => (
            <p key={index}>
              Node {index + 1} renders #6a9b00 on #ebf0db and measures 2.85:1, against the 4.5:1 minimum for normal
              text. The pair is documented in the contrast ledger, so this is an accepted deficiency rather than a new
              defect — but it is listed here because a reader auditing the page still has to see it.
            </p>
          ))}
        </AccordionItem>
        <AccordionItem label="Landmarks">Two regions share a role and a name.</AccordionItem>
      </Accordion>
    </div>
  ),
};
