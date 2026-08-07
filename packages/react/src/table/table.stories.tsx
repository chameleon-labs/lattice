import type {Meta, StoryObj} from '@storybook/react-vite';
import {Badge} from '../badge/badge.js';
import {TBody, THead, Table, Td, Th, Tr} from './table.js';

/**
 * `caption` and `scope` are required by the type rather than optional.
 *
 * They are the two commonest table defects there are, and both are invisible in
 * review. Making them required turns each omission into a compile error rather
 * than an audit finding — `tests/table.test.tsx` asserts that with
 * `@ts-expect-error`.
 */
const meta = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  // `caption` is required by the type, so Storybook requires it here — a story
  // cannot be written without one, which is the same guarantee the component
  // makes to consumers, enforced one level up.
  args: {
    caption: 'Audit history',
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

const rows = [
  {date: '30 July', score: 72, change: 'down 12', variant: 'danger'},
  {date: '29 July', score: 84, change: 'up 3', variant: 'success'},
  {date: '28 July', score: 81, change: 'no change', variant: 'default'},
] as const;

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <THead>
        <Tr>
          <Th scope="col">Date</Th>
          <Th scope="col">Score</Th>
          <Th scope="col">Change</Th>
        </Tr>
      </THead>
      <TBody>
        {rows.map((row) => (
          <Tr key={row.date}>
            <Th scope="row">{row.date}</Th>
            <Td>{row.score}</Td>
            <Td>
              <Badge variant={row.variant}>{row.change}</Badge>
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  ),
};

/**
 * The caption stays in the accessibility tree while leaving the layout.
 *
 * This is the escape hatch for a table whose heading already sits above it — not
 * a licence to drop the caption, which is why it hides rather than removes.
 */
export const VisuallyHiddenCaption: Story = {
  render: (args) => (
    <>
      <h2>Audit history</h2>
      <Table {...args} visuallyHiddenCaption>
        <THead>
          <Tr>
            <Th scope="col">Date</Th>
            <Th scope="col">Score</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr key={row.date}>
              <Th scope="row">{row.date}</Th>
              <Td>{row.score}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </>
  ),
};
