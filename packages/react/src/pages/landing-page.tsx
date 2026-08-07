import type {ReactNode} from 'react';
import {useState} from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Eyebrow,
  Input,
  Stat,
  TBody,
  THead,
  Table,
  Td,
  Th,
  Tr,
  VisuallyHidden,
} from '../index.js';
import type {BadgeVariant} from '../index.js';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  Globe,
  Info,
  Mail,
  Moon,
  Sun,
  TrendingDown,
  X,
  Zap,
} from './icons.js';
import type {IconProps} from './icons.js';
import {ScoreArc} from './score-arc.js';
import {ScoreChart} from './score-chart.js';

/**
 * The tabstop landing page, rebuilt from Lattice components alone.
 *
 * Source: `Custom Design System/src/app/App.tsx` — a marketing page for a
 * fictional accessibility-monitoring product, nine sections behind a sticky
 * nav. This is a faithful port of that structure, not a reinterpretation.
 * Two constructions the library cannot express are built as page-local
 * components rather than substituted with a lesser one — see the module
 * docs in `landing-page.stories.tsx` for the "one consumer, no reusable
 * guarantee" reasoning both share: the hero's `ScoreArc` gauge
 * (`./score-arc.js`) and the score-history section's line chart
 * (`./score-chart.js`), reproduced as inline SVG rather than by taking a
 * charting dependency.
 *
 * Every impact badge (`critical`/`serious`/`moderate`/`minor`) carries both
 * an icon and its text label — colour never carries severity alone, per the
 * spec's §1.4, and it is what keeps the ramp legible under protanopia and
 * deuteranopia regardless of hue.
 */

type Impact = 'critical' | 'serious' | 'moderate' | 'minor';

const IMPACT_ICON: Record<Impact, (props: IconProps) => ReactNode> = {
  critical: AlertCircle,
  serious: AlertTriangle,
  moderate: AlertTriangle,
  minor: Info,
};

const NAV_LINKS = [
  {id: 'how', label: 'How it works'},
  {id: 'why', label: 'Why tabstop'},
  {id: 'scope', label: 'v1 scope'},
] as const;

const TRUST_STATS = [
  {value: 'axe-core', label: 'Engine', sub: 'industry standard'},
  {value: 'Chromium', label: 'Browser', sub: 'via Playwright'},
  {value: 'Daily', label: 'Cadence', sub: 'automatic re-audits'},
  {value: '<1 hr', label: 'Alert lag', sub: 'after deploy detected'},
  {value: '30 sec', label: 'Setup time', sub: 'zero config'},
] as const;

const VIOLATIONS: ReadonlyArray<{impact: Impact; count: number; rule: string; desc: string}> = [
  {
    impact: 'critical',
    count: 2,
    rule: 'color-contrast',
    desc: 'Elements must meet minimum color contrast ratio',
  },
  {
    impact: 'serious',
    count: 5,
    rule: 'image-alt',
    desc: 'Images must have alternate text',
  },
  {
    impact: 'moderate',
    count: 3,
    rule: 'label',
    desc: 'Form elements must have labels',
  },
  {
    impact: 'minor',
    count: 7,
    rule: 'region',
    desc: 'All page content should be contained by landmarks',
  },
];

// The Recharts line chart this replaces plotted these same nine points on a
// continuous axis; a `Table` reads them as data instead of shape, which is
// the trade the gap list records.
const SCORE_HISTORY = [
  {date: 'Jul 1', score: 91},
  {date: 'Jul 5', score: 89},
  {date: 'Jul 9', score: 91},
  {date: 'Jul 13', score: 88},
  {date: 'Jul 17', score: 84},
  {date: 'Jul 21', score: 61},
  {date: 'Jul 25', score: 63},
  {date: 'Jul 29', score: 66},
  {date: 'Aug 2', score: 71},
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Paste a URL',
    body: 'No account, no pipeline, no config files. Drop in any public URL and tabstop kicks off a real Chromium audit — the same engine behind most a11y tooling in the industry.',
    detail: 'axe-core · Playwright · Chromium',
  },
  {
    n: '02',
    title: 'Get a score and violation list',
    body: 'Violations are grouped by impact: critical, serious, moderate, minor. Each entry shows affected selectors and links to fix documentation. The score is designed for trending, not gatekeeping.',
    detail: 'WCAG 2.1 AA · grouped by impact',
  },
  {
    n: '03',
    title: 'Track it over time',
    body: 'Add the URL to monitoring and tabstop re-audits it every day. Your score is charted so regressions are obvious at a glance. Any new serious or critical violation — or a score drop — sends one email.',
    detail: 'Daily cadence · one email per event',
  },
] as const;

// `highlight` — only the `tabstop` row carries it in the source, and it is
// what the comparison table's four-way distinguishing treatment (row tint,
// left rule, name weight/colour, Check colour) all key off. See `Why()`.
const COMPETITORS = [
  {
    name: 'Lighthouse CI',
    cost: 'Free',
    setup: 'Pipeline integration',
    trend: false,
    alert: false,
    zeroCfg: false,
    highlight: false,
  },
  {
    name: 'pa11y-dashboard',
    cost: 'Free',
    setup: 'Self-hosted',
    trend: true,
    alert: true,
    zeroCfg: false,
    highlight: false,
  },
  {name: 'axe Monitor', cost: '$$$', setup: 'Sales call', trend: true, alert: true, zeroCfg: false, highlight: false},
  {
    name: 'tabstop',
    cost: 'Free in beta',
    setup: 'Paste a URL',
    trend: true,
    alert: true,
    zeroCfg: true,
    highlight: true,
  },
] as const;

const V1_IN = [
  'Single public URLs',
  'Chromium (Playwright + axe-core)',
  'Daily re-audit cadence',
  'Email alerts on regression',
  'Public shareable result pages',
  'Score trend chart',
];

const V1_OUT = [
  'Site crawling',
  'Authenticated pages',
  'CI integration + API tokens',
  'Viewport matrix',
  'Teams & orgs',
  'Slack alerts',
  'WCAG level config',
];

const FOOTER_LINKS = ['DECISIONS.md', 'GitHub', 'How it works', 'Score formula'];

function Section({id, className, children}: {id?: string; className?: string; children: ReactNode}) {
  const cls = ['landing-page__section', className].filter((value): value is string => Boolean(value)).join(' ');
  return (
    <section id={id} className={cls}>
      {children}
    </section>
  );
}

function ImpactBadge({impact, count}: {impact: Impact; count?: number}) {
  const Icon = IMPACT_ICON[impact];
  return (
    <Badge variant={impact as BadgeVariant}>
      <Icon size={10} />
      {count === undefined ? impact : `${count} ${impact}`}
    </Badge>
  );
}

// Check reads muted by default and only turns accent-coloured on the
// highlighted row (`.landing-page__why-grid`'s `[data-highlight='true']`
// descendant rule); X stays muted at 30% opacity in every row regardless —
// see the CSS for why an absent feature never competes with a present one.
function BoolCell({value}: {value: boolean}) {
  return (
    <Td className="landing-page__bool-cell">
      {value ? (
        <Check size={13} className="landing-page__bool-check" />
      ) : (
        <X size={13} className="landing-page__bool-x" />
      )}
      <VisuallyHidden>{value ? 'Yes' : 'No'}</VisuallyHidden>
    </Td>
  );
}

function UrlField({inputLabel}: {inputLabel: string}) {
  return (
    <div className="landing-page__url-row">
      <Input
        type="url"
        addonStart={<Globe size={14} aria-hidden="true" />}
        aria-label={inputLabel}
        placeholder="https://yoursite.com"
        className="landing-page__url-field"
        inputClassName="landing-page__url-input"
      />
      <Button variant="primary" size="lg">
        Audit now
        <Zap size={13} />
      </Button>
    </div>
  );
}

function Nav() {
  const [isDark, setIsDark] = useState(true);

  return (
    <header className="landing-page__nav">
      <div className="landing-page__nav-inner">
        <div className="landing-page__brand">
          <span className="landing-page__logo-mark" aria-hidden="true">
            t/
          </span>
          <span className="landing-page__logo-text">tabstop</span>
          <Badge variant="default">beta</Badge>
        </div>

        <nav className="landing-page__nav-links" aria-label="Page sections">
          {NAV_LINKS.map((item) => (
            <Button key={item.id} variant="link" size="sm" render={<a href={`#${item.id}`} />}>
              {item.label}
            </Button>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="sm"
          className="landing-page__theme-toggle"
          aria-label="Preview the other theme"
          onClick={() => setIsDark((v) => !v)}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </Button>

        <Button variant="primary" size="sm" className="landing-page__nav-cta">
          Try it free
          <ArrowRight size={13} />
        </Button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <Section className="landing-page__hero">
      <div className="landing-page__hero-grid">
        <div className="landing-page__hero-copy">
          <div className="landing-page__hero-kicker">
            <Eyebrow tone="accent">Early access</Eyebrow>
            <span className="landing-page__hero-dot" aria-hidden="true" />
            <span className="landing-page__hero-kicker-sub">Building in public</span>
          </div>

          <h1 className="lat-page__display landing-page__display">
            Accessibility
            <br />
            monitoring
            <br />
            <span className="landing-page__accent-text">without the setup.</span>
          </h1>

          <p className="landing-page__lede">
            Paste a URL, get an audit and a score. tabstop re-audits daily, charts your score over time, and emails you
            the day a deploy makes things worse.
          </p>

          <UrlField inputLabel="Website URL" />

          <p className="landing-page__meta">No account needed · Results in ~30 seconds</p>
        </div>

        <div className="landing-page__audit-wrap">
          <div className="landing-page__audit-glow" aria-hidden="true" />

          <Card data-elevation="floating" className="landing-page__audit-card">
            {/* Browser chrome, not a panel header — deliberately not `CardHeader`,
                whose eyebrow convention (uppercase, letter-spaced) is wrong for a
                URL bar. Built as page markup instead of a `CardHeader` variant,
                per the resolution recorded in the design spec. */}
            <div className="landing-page__audit-header">
              <div className="landing-page__audit-dots" aria-hidden="true">
                <span className="landing-page__audit-dot landing-page__audit-dot--critical" />
                <span className="landing-page__audit-dot landing-page__audit-dot--serious" />
                <span className="landing-page__audit-dot landing-page__audit-dot--primary" />
              </div>
              <span className="landing-page__audit-url">https://ariakit.org</span>
              <span className="landing-page__audit-meta">audited 4 min ago</span>
            </div>

            <CardBody className="landing-page__audit-summary">
              <ScoreArc score={71} size={100} />

              <div className="landing-page__audit-signals">
                <div>
                  <div className="landing-page__audit-violations-label">Violations</div>
                  <div className="landing-page__audit-counts">
                    {VIOLATIONS.map((v) => (
                      <span
                        key={v.impact}
                        className={`landing-page__audit-count landing-page__audit-count--${v.impact}`}
                      >
                        {v.count} {v.impact}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="landing-page__audit-trend">
                  <TrendingDown size={12} />
                  <span>−20 pts since Jul 21 deploy</span>
                </div>
                <div className="landing-page__audit-alert">
                  <Mail size={11} />
                  <span>Alert sent</span>
                </div>
              </div>
            </CardBody>

            <ul className="landing-page__audit-violations">
              {VIOLATIONS.slice(0, 3).map((v) => (
                <li key={v.rule} className="landing-page__audit-violation">
                  <ImpactBadge impact={v.impact} />
                  <div className="landing-page__audit-violation-copy">
                    <p className="landing-page__audit-violation-rule">{v.rule}</p>
                    <p className="landing-page__audit-violation-desc">{v.desc}</p>
                  </div>
                  <span className="landing-page__audit-violation-count">{v.count}×</span>
                </li>
              ))}
            </ul>

            <div className="landing-page__audit-footer">
              <Button variant="link" size="sm">
                View full report
                <ExternalLink size={10} />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

function TrustBar() {
  return (
    <div className="landing-page__trust-bar">
      <Section className="landing-page__trust-bar-inner">
        {TRUST_STATS.map((s) => (
          <Stat key={s.label} value={s.value} label={s.label} sub={s.sub} className="landing-page__trust-stat" />
        ))}
      </Section>
    </div>
  );
}

function HowItWorks() {
  return (
    <Section id="how" className="landing-page__how">
      <Eyebrow rule tone="accent" className="landing-page__section-eyebrow">
        How it works
      </Eyebrow>
      <h2 className="landing-page__heading landing-page__heading--how">Zero setup. Baseline in thirty seconds.</h2>

      <div className="landing-page__steps">
        {STEPS.map((s) => (
          <Card key={s.n}>
            <CardBody>
              <span className="landing-page__step-index">{s.n}</span>
              <h3 className="landing-page__step-title">{s.title}</h3>
              <p className="landing-page__step-body">{s.body}</p>
              <p className="landing-page__step-detail">{s.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </Section>
  );
}

/**
 * Ported from the source bundle's Recharts `<LineChart>` as inline SVG —
 * see `./score-chart.tsx` for the geometry and interpolation, and the gap
 * list's "Deliberate omissions" for why a chart at all: a `Table` alone
 * reads these nine points as data, not as the shape of a regression, and
 * the section's own copy ("−20 pts since Jul 21") is pointing at that
 * shape.
 *
 * The chart is `aria-hidden`, so the `Table` stays — as the accessible
 * equivalent rather than the primary rendering, wrapped in `VisuallyHidden`
 * inside the same `<figure>`. The `figure`'s `aria-label` carries the
 * chart's headline fact for anyone who never sees the SVG at all; the
 * hidden `Table` carries every point for anyone who wants more than the
 * headline.
 */
function ScoreHistory() {
  return (
    <Section className="landing-page__score-history">
      <Card>
        <CardHeader label="Score history — ariakit.org">
          <Badge variant="danger">
            <TrendingDown size={12} />
            −20 pts since Jul 21
          </Badge>
        </CardHeader>
        <CardBody className="landing-page__score-history-body">
          <Stat
            value="71"
            label="Current score"
            sub="down from 91 on Jul 1"
            className="landing-page__score-history-stat"
          />

          <figure
            className="landing-page__chart-figure"
            aria-label="Score history for ariakit.org: a line chart of nine audits from Jul 1 to Aug 2, trending down 20 points since Jul 21"
          >
            <ScoreChart data={SCORE_HISTORY} referenceDate="Jul 21" />
            <VisuallyHidden>
              <Table caption="Score history for ariakit.org, nine audits from Jul 1 to Aug 2" visuallyHiddenCaption>
                <THead>
                  <Tr>
                    <Th scope="col">Date</Th>
                    <Th scope="col">Score</Th>
                  </Tr>
                </THead>
                <TBody>
                  {SCORE_HISTORY.map((point) => (
                    <Tr key={point.date}>
                      <Th scope="row">{point.date}</Th>
                      <Td>{point.score}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </VisuallyHidden>
          </figure>
        </CardBody>
      </Card>
    </Section>
  );
}

function Why() {
  return (
    <Section id="why" className="landing-page__why">
      <Eyebrow rule tone="accent" className="landing-page__section-eyebrow">
        Why tabstop
      </Eyebrow>

      <div className="landing-page__why-grid">
        <div>
          <h2 className="landing-page__heading landing-page__heading--why">
            CI catches regressions
            <br />
            if you set it up.
            <br />
            <span className="landing-page__muted-inline">Nobody sets it up.</span>
          </h2>
          <p className="landing-page__muted">
            I contribute to Ariakit, an accessibility-focused UI component library. This is the monitoring tool I kept
            wishing the people using it had — zero-setup, monitoring rather than gating.
          </p>
          <p className="landing-page__muted">
            Existing options each miss the mark for small teams: CI tools need engineering buy-in, dashboards need
            self-hosting, and commercial monitors start with a sales call.
          </p>
        </div>

        <Card>
          <CardBody>
            <Table caption="How tabstop compares to other accessibility monitoring tools" visuallyHiddenCaption>
              <THead>
                <Tr>
                  <Th scope="col">Tool</Th>
                  <Th scope="col">Setup</Th>
                  <Th scope="col" className="landing-page__bool-header">
                    Trend
                  </Th>
                  <Th scope="col" className="landing-page__bool-header">
                    Alerts
                  </Th>
                  <Th scope="col" className="landing-page__bool-header">
                    0-cfg
                  </Th>
                </Tr>
              </THead>
              <TBody>
                {COMPETITORS.map((c) => (
                  <Tr key={c.name} data-highlight={c.highlight ? 'true' : undefined}>
                    <Th scope="row">
                      <span className="landing-page__competitor-name">{c.name}</span>
                      <span className="landing-page__competitor-cost">{c.cost}</span>
                    </Th>
                    <Td>{c.setup}</Td>
                    <BoolCell value={c.trend} />
                    <BoolCell value={c.alert} />
                    <BoolCell value={c.zeroCfg} />
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </Section>
  );
}

function V1Scope() {
  return (
    <Section id="scope" className="landing-page__scope">
      <Eyebrow rule tone="accent" className="landing-page__section-eyebrow">
        v1 scope
      </Eyebrow>
      <h2 className="landing-page__heading landing-page__heading--scope">Deliberately scoped.</h2>

      <div className="landing-page__scope-grid">
        <Card>
          <CardHeader label="In v1" />
          <CardBody>
            <ul className="landing-page__scope-list">
              {V1_IN.map((item) => (
                <li key={item}>
                  <Check size={13} className="landing-page__check-icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader label="Not in v1 — roadmap" />
          <CardBody>
            <ul className="landing-page__scope-list landing-page__scope-list--muted">
              {V1_OUT.map((item) => (
                <li key={item}>
                  <ChevronRight size={13} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </Section>
  );
}

function CTA() {
  return (
    <div className="landing-page__cta">
      <Section className="landing-page__cta-inner">
        <div className="landing-page__cta-content">
          <Eyebrow tone="accent" align="center" className="landing-page__cta-eyebrow">
            Early access — free
          </Eyebrow>
          <h2 className="landing-page__heading landing-page__heading--cta">Know the moment you break accessibility.</h2>
          <p className="landing-page__muted">No account needed to run your first audit.</p>

          <UrlField inputLabel="Website URL (early access)" />

          <p className="landing-page__meta">MIT licensed · Built in public · Follow DECISIONS.md</p>
        </div>
      </Section>
    </div>
  );
}

function Footer() {
  return (
    <footer className="landing-page__footer">
      <Section className="landing-page__footer-inner">
        <div className="landing-page__brand">
          <span className="landing-page__logo-mark" aria-hidden="true">
            t/
          </span>
          <span className="landing-page__footer-copy">tabstop — MIT license</span>
        </div>

        <nav className="landing-page__footer-links" aria-label="Footer links">
          {FOOTER_LINKS.map((label) => (
            <Button key={label} variant="link" size="sm" render={<a href="#" />}>
              {label}
            </Button>
          ))}
        </nav>
      </Section>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="lat-page lat-surface landing-page">
      <Nav />
      <main className="landing-page__main">
        <Hero />
        <TrustBar />
        <HowItWorks />
        <ScoreHistory />
        <Why />
        <V1Scope />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
