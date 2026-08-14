import type {Meta, StoryObj} from '@storybook/react-vite';
import {AddonButton} from '../addon-button/addon-button.js';
import {Button} from '../button/button.js';
import {Tooltip, TooltipAnchor, TooltipProvider} from './tooltip.js';

const InfoIcon = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

/**
 * A tooltip never names. The trigger carries its own accessible name, and the
 * tooltip adds nothing to the accessibility tree — Ariakit associates it with
 * neither `aria-labelledby` nor `aria-describedby`, so its text is not
 * announced at all.
 *
 * Nothing may live only in a tooltip: no hover on touch, no press affordance,
 * and not announced. Anything said here has to be available elsewhere too. See
 * the component README.
 */
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <TooltipAnchor render={<Button>Re-run audit</Button>} />
      <Tooltip>Re-runs every check against the current page</Tooltip>
    </TooltipProvider>
  ),
};

/** On an icon-only control, which already names itself — the tooltip adds detail, not a name. */
export const OnAnIconButton: Story = {
  render: () => (
    <TooltipProvider>
      <TooltipAnchor
        render={
          <AddonButton label="Copy page URL">
            <InfoIcon />
          </AddonButton>
        }
      />
      <Tooltip>Copies the audited URL to your clipboard</Tooltip>
    </TooltipProvider>
  ),
};

/**
 * A natively `disabled` button fires no pointer or focus events, so its tooltip
 * would never open — exactly where an explanation is wanted most. Ariakit's
 * `accessibleWhenDisabled` keeps the control focusable and marks it
 * `aria-disabled` instead, which is what makes this work.
 */
export const OnADisabledTrigger: Story = {
  render: () => (
    <TooltipProvider>
      <TooltipAnchor
        render={
          <Button disabled accessibleWhenDisabled>
            Re-run audit
          </Button>
        }
      />
      <Tooltip>Sign in before re-running an audit</Tooltip>
    </TooltipProvider>
  ),
};

/** Long enough to wrap, so the surface is measured rather than assumed to fit. */
export const Wrapping: Story = {
  render: () => (
    <TooltipProvider>
      <TooltipAnchor render={<Button>Scoring</Button>} />
      <Tooltip>
        The score weights each failing check by its severity and by how many nodes it affects, then normalises against
        the page total.
      </Tooltip>
    </TooltipProvider>
  ),
};
