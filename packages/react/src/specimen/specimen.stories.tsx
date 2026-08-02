import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../badge/badge.js'
import { Button } from '../button/button.js'
import { Callout } from '../callout/callout.js'
import { Card } from '../card/card.js'
import { Switch } from '../switch/switch.js'
import { TBody, THead, Table, Td, Th, Tr } from '../table/table.js'
import { TextField } from '../text-field/text-field.js'

/**
 * One composed screen, for judging a visual direction.
 *
 * Every other story isolates a family so a failure names it. This one does the
 * opposite on purpose: a direction is a claim about how things look *next to
 * each other*, and that claim cannot be evaluated a component at a time. A row
 * of buttons is not a design system.
 *
 * It carries no `component`, because it is not documenting one — and no
 * `autodocs` tag for the same reason. What it documents is the composition.
 *
 * Titled under Components/ because `story-coverage.test.ts` requires every story
 * file to be, and because the browser sweep matches stories by
 * `Components/<Family>` — a story titled anything else would be indexed,
 * rendered, and never scanned.
 */
const meta = {
  title: 'Components/Specimen'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const FINDINGS = [
  { page: '/pricing', issue: 'Links rely on colour alone', impact: 'critical' },
  { page: '/docs/install', issue: 'Label not associated with its input', impact: 'serious' },
  { page: '/blog', issue: 'Heading levels skip h2 to h4', impact: 'moderate' },
  { page: '/about', issue: 'Redundant alt text on a decorative image', impact: 'minor' }
] as const

export const Dashboard: Story = {
  render: () => (
    <div className="lat-story__stack">
      <h1>Accessibility report</h1>

      <Callout tone="warning" title="Automated testing is not proof">
        Automated checks cover roughly a third of the WCAG success criteria. A
        clean run is a starting point, not a pass.
      </Callout>

      <div className="lat-story__row">
        <Card>
          <h2>Score</h2>
          <p>82 of 100, down 4 since the last run.</p>
          <div className="lat-story__row">
            {FINDINGS.map((finding) => (
              <Badge key={finding.impact} tone={finding.impact}>
                1 {finding.impact}
              </Badge>
            ))}
          </div>
        </Card>

        <Card>
          <h2>Monitoring</h2>
          <div className="lat-story__row">
            <label htmlFor="specimen-switch">Email me on regressions</label>
            <Switch id="specimen-switch" defaultChecked />
          </div>
        </Card>
      </div>

      <Table caption="Issues found on the most recent run">
        <THead>
          <Tr>
            <Th scope="col">Page</Th>
            <Th scope="col">Issue</Th>
            <Th scope="col">Impact</Th>
          </Tr>
        </THead>
        <TBody>
          {FINDINGS.map((finding) => (
            <Tr key={finding.page}>
              <Th scope="row">{finding.page}</Th>
              <Td>{finding.issue}</Td>
              <Td>
                <Badge tone={finding.impact}>{finding.impact}</Badge>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>

      <div className="lat-story__row">
        <TextField label="Add a URL to monitor" placeholder="https://example.com" />
        <Button>Run audit</Button>
        <Button variant="soft" tone="neutral">
          Export
        </Button>
      </div>
    </div>
  )
}
