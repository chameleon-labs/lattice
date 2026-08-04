import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CodeBlock,
  Eyebrow,
  SegmentedControl,
  SegmentedControlItem,
  Stat,
  TBody,
  THead,
  Table,
  Td,
  Th,
  Tr,
  TextField
} from '../index.js'
import { Check, ChevronRight, Circle, Copy, Moon, Square, Sun, Triangle, Zap } from './icons.js'

/**
 * The Meridian documentation site, rebuilt from Lattice components alone.
 *
 * Source: `Custom Design System/src/app/App.tsx`, a six-section reference
 * site — Overview, Tokens, Typography, Components, Patterns, Motion — behind
 * a sidebar/topbar shell. This is a faithful port of that structure, not a
 * reinterpretation: every panel is the same `Card` + eyebrow-labelled header
 * construction the source draws by hand, and every colour swatch, spacing bar
 * and duration preset reads a real `--lat-*` custom property rather than the
 * bundle's literal hex values or millisecond counts — so the page proves the
 * shipped system instead of restating the design file.
 */

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'typography', label: 'Typography' },
  { id: 'components', label: 'Components' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'motion', label: 'Motion' }
] as const

const RESOURCES = ['Figma Kit', 'GitHub', 'Changelog', 'RFC Process']

// Every value below is a live `--lat-*` role, not the bundle's `#cff23a` —
// the point of this page is to prove the token, so the swatch reads the
// custom property directly and lets the active theme resolve its colour.
const COLOR_TOKENS = [
  { token: '--lat-bg', label: 'Background' },
  { token: '--lat-bg-raised', label: 'Raised' },
  { token: '--lat-bg-subtle', label: 'Subtle' },
  { token: '--lat-text', label: 'Foreground' },
  { token: '--lat-text-subtle', label: 'Muted' },
  { token: '--lat-accent-solid', label: 'Primary' },
  { token: '--lat-border', label: 'Border' },
  { token: '--lat-info-solid', label: 'Info' },
  { token: '--lat-success-solid', label: 'Success' },
  { token: '--lat-danger-solid', label: 'Destructive' },
  { token: '--lat-warning-solid', label: 'Warning' },
  { token: '--lat-chart-3', label: 'Accent' }
]

const SPACING_TOKENS = [
  { token: '--lat-space-1', px: 4 },
  { token: '--lat-space-2', px: 8 },
  { token: '--lat-space-3', px: 12 },
  { token: '--lat-space-4', px: 16 },
  { token: '--lat-space-6', px: 24 },
  { token: '--lat-space-8', px: 32 },
  { token: '--lat-space-12', px: 48 },
  { token: '--lat-space-16', px: 64 },
  { token: '--lat-space-24', px: 96 },
  { token: '--lat-space-32', px: 128 }
]

// Lattice's own duration scale, in place of the bundle's arbitrary ms list —
// there are exactly five steps in each, so the swap is one-to-one.
const MOTION_PRESETS = [
  { label: 'Instant', duration: 'instant', easing: undefined, easingLabel: 'instant' },
  { label: 'Swift', duration: 'swift', easing: 'out', easingLabel: 'ease-out' },
  { label: 'Default', duration: 'default', easing: 'out', easingLabel: 'ease-out' },
  { label: 'Deliberate', duration: 'deliberate', easing: 'in-out', easingLabel: 'ease-in-out' },
  { label: 'Expressive', duration: 'expressive', easing: 'in-out', easingLabel: 'ease-in-out' }
] as const

const CARD_ANATOMY = [
  { icon: Circle, tone: 'primary', title: 'Primitive', tag: 'headless', desc: 'Unstyled base with slot architecture. Compose with your own tokens.' },
  { icon: Square, tone: 'info', title: 'Styled', tag: 'opinionated', desc: 'Opinionated defaults from the Meridian token set. Ready to ship.' },
  { icon: Triangle, tone: 'accent', title: 'Compound', tag: 'compound', desc: 'Multi-part components with coordinated state. Complex patterns simplified.' }
] as const

const PALETTE_ROWS = [
  { name: '--lat-accent-solid', label: 'Color' },
  { name: '--lat-radius-none', label: 'Radius' },
  { name: '--lat-font-sans', label: 'Font' }
]

const TABLE_ROWS = [
  { name: 'color.accent.solid', value: 'accent-solid', status: 'stable' },
  { name: 'color.bg', value: 'bg', status: 'stable' },
  { name: 'radius.none', value: '0px', status: 'stable' },
  { name: 'chart.decorative', value: 'chart-3', status: 'beta' },
  { name: 'gradient.mesh', value: 'complex', status: 'draft' }
] as const

const STATUS_VARIANT = { stable: 'success', beta: 'info', draft: 'default' } as const

const OVERVIEW_STATS = [
  { value: '39', label: 'Components', sub: 'public exports' },
  { value: '223', label: 'Tokens', sub: 'design variables' },
  { value: '18', label: 'Families', sub: 'restyled in phase 2' },
  { value: '161', label: 'Unit tests', sub: 'passing' }
]

// `as` picks the element the sample renders as. h1/h2/h3 read their size from
// base.css's own bare-element rules — the same free styling a consumer's
// unclassed heading gets — so only display/body/small/mono need a page-level
// class reading their `--lat-text-*` role directly (base.css has no bare-body
// rule to lean on the way it does for headings).
const TYPE_SCALE = [
  { name: 'Display', desc: '48 / bold', sample: 'Aa', as: 'div', role: 'display' },
  { name: 'Heading 1', desc: '30 / semibold', sample: 'Heading one', as: 'h1', role: undefined },
  { name: 'Heading 2', desc: '24 / medium', sample: 'Heading two', as: 'h2', role: undefined },
  { name: 'Heading 3', desc: '20 / medium', sample: 'Heading three', as: 'h3', role: undefined },
  { name: 'Body', desc: '16 / regular', sample: 'The quick brown fox jumps over the lazy dog.', as: 'p', role: undefined },
  { name: 'Small', desc: '14 / regular', sample: 'Caption and helper text appear at this scale.', as: 'p', role: 'small' },
  { name: 'Mono', desc: '14 mono / regular', sample: 'const value = tokens.accentSolid', as: 'p', role: 'mono' }
] as const

/** Copies `text` to the clipboard and clears the sighted "copied" cue after
 *  a beat — the same shape `CodeBlock` uses internally, but this page also
 *  needs it for the per-swatch copy control `CodeBlock` has no slot for. */
function useCopyFeedback() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copy = (key: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1200)
  }
  return { copiedKey, copy }
}

function SectionHead({ index, children }: { index: string; children: string }) {
  return (
    <div className="system-page__section-head">
      <span className="system-page__section-index">{index}</span>
      <Eyebrow rule>{children}</Eyebrow>
    </div>
  )
}

function OverviewSection() {
  return (
    <section id="overview" className="system-page__section">
      <SectionHead index="00">Overview</SectionHead>

      <div className="system-page__overview-grid">
        <Card data-elevation="floating" className="system-page__hero">
          <CardBody>
            <div className="system-page__badge-row">
              <Badge variant="primary">v1.0.0</Badge>
              <Badge variant="success">Stable</Badge>
            </div>
            <h1 className="system-page__display">
              Meridian
              <br />
              <span className="system-page__display-accent">Design System</span>
            </h1>
            <p className="system-page__lede">
              A precise, developer-first component library built for teams who care about the
              details. Every token intentional. Every interaction considered.
            </p>
          </CardBody>
        </Card>

        <div className="system-page__stats">
          {OVERVIEW_STATS.map((s) => (
            <Card key={s.label}>
              <CardBody>
                <Stat value={s.value} label={s.label} sub={s.sub} />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <CodeBlock
        code={`npm install @chameleon-labs/lattice-react\n\n# Then import in your entrypoint:\nimport '@chameleon-labs/lattice-react/styles.css'`}
        copyLabel="Copy install command"
        regionLabel="Install command"
      />
    </section>
  )
}

function TokensSection() {
  const { copiedKey, copy } = useCopyFeedback()

  return (
    <section id="tokens" className="system-page__section">
      <SectionHead index="01">Tokens</SectionHead>

      <Card className="system-page__panel">
        <CardHeader label="Color Tokens">
          <Badge variant="info">{COLOR_TOKENS.length}</Badge>
        </CardHeader>
        <CardBody>
          <div className="system-page__swatch-grid">
            {COLOR_TOKENS.map((t) => (
              <Card key={t.token}>
                <div
                  className="system-page__swatch-color"
                  style={{ background: `var(${t.token})` }}
                />
                <CardBody>
                  <div className="system-page__swatch-row">
                    <span className="system-page__swatch-label">{t.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Copy ${t.token}`}
                      onClick={() => copy(t.token, t.token)}
                    >
                      {copiedKey === t.token ? <Check /> : <Copy />}
                    </Button>
                  </div>
                  <span className="system-page__swatch-token">{t.token}</span>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="system-page__panel">
        <CardHeader label="Spacing Scale" />
        <CardBody>
          <div className="system-page__spacing-scale">
            {SPACING_TOKENS.map((s) => (
              <div key={s.token} className="system-page__spacing-row">
                <span className="system-page__spacing-name">{s.token}</span>
                <div
                  className="system-page__spacing-bar"
                  style={{ inlineSize: `var(${s.token})` }}
                />
                <span className="system-page__spacing-px">{s.px}px</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  )
}

function TypographySection() {
  return (
    <section id="typography" className="system-page__section">
      <SectionHead index="02">Typography</SectionHead>

      <Card className="system-page__panel">
        <CardBody className="system-page__type-scale">
          {TYPE_SCALE.map((t) => {
            const Tag = t.as
            const sampleClass = [
              'system-page__type-sample',
              t.role === undefined ? null : `system-page__type-${t.role}`
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <div key={t.name} className="system-page__type-row">
                <div className="system-page__type-meta">
                  <span className="system-page__type-name">{t.name}</span>
                  <span className="system-page__type-desc">{t.desc}</span>
                </div>
                <Tag className={sampleClass}>{t.sample}</Tag>
              </div>
            )
          })}
        </CardBody>
      </Card>

      <CodeBlock
        code={`/* Font stack */\n--lat-font-sans: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;\n--lat-font-mono: 'JetBrains Mono', ui-monospace, monospace;`}
        copyLabel="Copy font stack"
        regionLabel="Font stack"
      />
    </section>
  )
}

function ComponentsSection() {
  const [tokenName, setTokenName] = useState('')
  const [mode, setMode] = useState('system')

  return (
    <section id="components" className="system-page__section">
      <SectionHead index="03">Components</SectionHead>

      <Card className="system-page__panel">
        <CardHeader label="Button" />
        <CardBody className="system-page__row-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
        </CardBody>
      </Card>

      <div className="system-page__two-col">
        <Card>
          <CardHeader label="Input" />
          <CardBody className="system-page__field-stack">
            <TextField
              label="Token name"
              placeholder="--lat-accent-solid"
              value={tokenName}
              onChange={(event) => setTokenName(event.target.value)}
            />
            <TextField label="Disabled" value="ui.color.accent.solid" disabled />
          </CardBody>
        </Card>

        <Card>
          <CardHeader label="Badge" />
          <CardBody className="system-page__row-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
          </CardBody>
        </Card>
      </div>

      <Card className="system-page__panel">
        <CardHeader label="Segmented Control" />
        <CardBody>
          <SegmentedControl value={mode} setValue={setMode} aria-label="Preview mode">
            <SegmentedControlItem value="system">System</SegmentedControlItem>
            <SegmentedControlItem value="light">Light</SegmentedControlItem>
            <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
          </SegmentedControl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader label="Card" />
        <CardBody className="system-page__anatomy-grid">
          {CARD_ANATOMY.map((c) => (
            <Card key={c.title}>
              <CardBody>
                <div className="system-page__anatomy-head">
                  <c.icon size={16} className="system-page__tone" data-tone={c.tone} />
                  <Badge variant="default">{c.tag}</Badge>
                </div>
                <h4 className="system-page__anatomy-title">{c.title}</h4>
                <p className="system-page__anatomy-desc">{c.desc}</p>
              </CardBody>
            </Card>
          ))}
        </CardBody>
      </Card>
    </section>
  )
}

function PatternsSection() {
  return (
    <section id="patterns" className="system-page__section">
      <SectionHead index="04">Patterns</SectionHead>

      <div className="system-page__two-col">
        <Card>
          <CardHeader label="Command Palette" />
          <CardBody>
            <div className="system-page__palette">
              <div className="system-page__palette-search">
                <span className="system-page__palette-placeholder">Search tokens…</span>
                <Badge variant="default">⌘K</Badge>
              </div>
              {PALETTE_ROWS.map((r, i) => (
                <div
                  key={r.name}
                  className="system-page__palette-row"
                  data-active={i === 0 ? '' : undefined}
                >
                  {i === 0 ? (
                    <ChevronRight size={11} className="system-page__tone" data-tone="primary" />
                  ) : (
                    <span className="system-page__palette-spacer" />
                  )}
                  <span className="system-page__palette-name">{r.name}</span>
                  <Badge variant="default">{r.label}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader label="Token Table" />
          <CardBody>
            <Table caption="Design tokens and their publish status" visuallyHiddenCaption>
              <THead>
                <Tr>
                  <Th scope="col">Name</Th>
                  <Th scope="col">Value</Th>
                  <Th scope="col">Status</Th>
                </Tr>
              </THead>
              <TBody>
                {TABLE_ROWS.map((row) => (
                  <Tr key={row.name}>
                    <Th scope="row">{row.name}</Th>
                    <Td>{row.value}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </section>
  )
}

function MotionSection() {
  const [playing, setPlaying] = useState<string | null>(null)

  const play = (label: string) => {
    setPlaying(label)
    window.setTimeout(() => setPlaying((current) => (current === label ? null : current)), 700)
  }

  return (
    <section id="motion" className="system-page__section">
      <SectionHead index="05">Motion</SectionHead>

      <Card>
        <CardHeader label="Duration Presets" icon={<Zap size={12} />} />
        <CardBody className="system-page__motion-list">
          {MOTION_PRESETS.map((p) => (
            <div key={p.label} className="system-page__motion-row">
              <span className="system-page__motion-label">{p.label}</span>
              <div className="system-page__motion-track">
                <span
                  className="system-page__motion-dot"
                  data-duration={p.duration}
                  data-easing={p.easing}
                  data-playing={playing === p.label ? '' : undefined}
                />
              </div>
              <Badge variant="default">{p.easingLabel}</Badge>
              <Button variant="ghost" size="sm" onClick={() => play(p.label)}>
                Play
              </Button>
            </div>
          ))}
        </CardBody>
      </Card>
    </section>
  )
}

function Sidebar({ active, onNavigate }: { active: string; onNavigate: (id: string) => void }) {
  return (
    <aside className="system-page__sidebar">
      <div className="system-page__logo">
        <span className="system-page__logo-mark" aria-hidden="true" />
        <span className="system-page__logo-text">Meridian</span>
      </div>

      <nav className="system-page__nav">
        {NAV.map((item) => (
          <Button
            key={item.id}
            variant={active === item.id ? 'primary' : 'ghost'}
            size="sm"
            className="system-page__nav-item"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </Button>
        ))}

        <div className="system-page__resources">
          <Eyebrow>Resources</Eyebrow>
          {RESOURCES.map((r) => (
            <div key={r} className="system-page__resource">
              <ChevronRight size={10} />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="system-page__sidebar-footer">
        <Badge variant="primary">v1.0.0</Badge>
      </div>
    </aside>
  )
}

function Topbar({ active }: { active: string }) {
  const [isDark, setIsDark] = useState(true)
  const activeLabel = NAV.find((item) => item.id === active)?.label ?? active

  return (
    <header className="system-page__topbar">
      <span className="system-page__crumb">meridian</span>
      <ChevronRight size={10} />
      <span className="system-page__crumb">{activeLabel}</span>
      <div className="system-page__topbar-end">
        <Badge variant="success">All systems nominal</Badge>
        <Button variant="ghost" size="sm" onClick={() => setIsDark((v) => !v)}>
          {isDark ? <Sun size={12} /> : <Moon size={12} />}
          {isDark ? 'Light' : 'Dark'}
        </Button>
      </div>
    </header>
  )
}

export function SystemPage() {
  const [active, setActive] = useState('overview')

  const navigate = (id: string) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="lat-page lat-surface system-page">
      <Sidebar active={active} onNavigate={navigate} />
      <main className="system-page__main">
        <Topbar active={active} />
        <div className="system-page__content">
          <OverviewSection />
          <TokensSection />
          <TypographySection />
          <ComponentsSection />
          <PatternsSection />
          <MotionSection />
        </div>
      </main>
    </div>
  )
}
