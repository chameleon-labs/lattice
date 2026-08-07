import type {Meta, StoryObj} from '@storybook/react-vite';
import {Switch, type SwitchProps} from './switch.js';

/**
 * A native checkbox carrying `role="switch"`, paired with a real `<label>`.
 *
 * The label is bound with `htmlFor` rather than supplied as `aria-label`,
 * because that is how a consumer should use it: a visible label is also a
 * click target, which an `aria-label` is not.
 *
 * `Off` and `On` are separate stories rather than one story with a control.
 * `tests/browser/a11y.spec.ts` compares the computed `::before` transform of one
 * against the other under `prefers-reduced-motion: reduce`, and a control state
 * is not in Storybook's index, so it could not be visited.
 */
const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

const labelled = (text: string) =>
  function LabelledSwitch(args: SwitchProps): React.JSX.Element {
    return (
      <div className="lat-story__row">
        <label htmlFor="story-switch">{text}</label>
        <Switch {...args} id="story-switch" />
      </div>
    );
  };

export const Off: Story = {
  render: labelled('Paused'),
};

export const On: Story = {
  args: {defaultChecked: true},
  render: labelled('Monitoring'),
};

export const Disabled: Story = {
  args: {disabled: true},
  render: labelled('Unavailable'),
};
