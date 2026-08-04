/**
 * `monotoneLinePath` reproduces d3-shape's `curveMonotoneX` — the algorithm
 * behind Recharts' `type="monotone"` — rather than a generic smooth curve or
 * a straight polyline. The property that actually distinguishes it, and the
 * one this file exists to pin, is *no overshoot*: a monotone cubic never
 * swings past the vertical range of the two points it is interpolating
 * between. A natural/Catmull-Rom-style spline routinely does (it optimises
 * for a smooth second derivative, not for staying in-bounds), and a straight
 * polyline has no curve to overshoot with — so this test would not
 * distinguish "monotone" from "polyline" on its own; the second `describe`
 * block below does that half.
 */
import { describe, expect, it } from 'vitest'
import { monotoneLinePath, type Point } from '../src/pages/monotone-path.js'

// Samples a single cubic Bezier segment `C c1x,c1y c2x,c2y ex,ey` (relative
// to a known start point) at `steps` evenly spaced parameter values.
function sampleCubic(
  p0: Point,
  c1: Point,
  c2: Point,
  p1: Point,
  steps: number
): Point[] {
  const points: Point[] = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const mt = 1 - t
    const x =
      mt * mt * mt * p0.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p1.x
    const y =
      mt * mt * mt * p0.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p1.y
    points.push({ x, y })
  }
  return points
}

// Parses the `M`/`C` path this module emits back into per-segment control
// points, so the test can sample the actual curve rather than re-deriving
// tangents independently (which would just test the test).
function parseSegments(d: string): Array<[Point, Point, Point, Point]> {
  const commands = d.match(/[MC][^MC]*/g) ?? []
  const nums = (s: string) => s.slice(1).split(',').map(Number)
  let cursor: Point = { x: 0, y: 0 }
  const segments: Array<[Point, Point, Point, Point]> = []

  for (const command of commands) {
    if (command.startsWith('M')) {
      const [x, y] = nums(command)
      cursor = { x: x!, y: y! }
      continue
    }
    const [c1x, c1y, c2x, c2y, ex, ey] = nums(command)
    const c1 = { x: c1x!, y: c1y! }
    const c2 = { x: c2x!, y: c2y! }
    const end = { x: ex!, y: ey! }
    segments.push([cursor, c1, c2, end])
    cursor = end
  }

  return segments
}

describe('monotoneLinePath', () => {
  it('does not overshoot: every sampled point on a segment stays within that segment’s own y-range', () => {
    // The score-history shape itself: two monotone runs (down, then up)
    // either side of the Jul 21 elbow — exactly the case a non-monotone
    // spline overshoots on, since the tangent either side of the elbow
    // would otherwise pull the curve past 84 or below 61.
    const data = [91, 89, 91, 88, 84, 61, 63, 66, 71]
    const points: Point[] = data.map((score, i) => ({ x: i * 50, y: 100 - score }))

    const d = monotoneLinePath(points)
    const segments = parseSegments(d)
    expect(segments).toHaveLength(points.length - 1)

    segments.forEach(([p0, c1, c2, p1], i) => {
      const yMin = Math.min(p0.y, p1.y)
      const yMax = Math.max(p0.y, p1.y)
      const sampled = sampleCubic(p0, c1, c2, p1, 50)

      for (const { y } of sampled) {
        // A generous floating-point tolerance, not a leniency on the
        // property itself — the algorithm's guarantee is exact, this
        // margin only absorbs sampling/arithmetic error.
        expect(y, `segment ${i} overshot its own endpoints`).toBeGreaterThanOrEqual(yMin - 1e-6)
        expect(y, `segment ${i} overshot its own endpoints`).toBeLessThanOrEqual(yMax + 1e-6)
      }
    })
  })

  it('is a genuine curve, not a straight polyline wearing a C command', () => {
    // Three points with a bend: a polyline's "curve" through the middle
    // point sits exactly on the straight line to the third point's
    // direction; a monotone cubic's control points do not collapse onto
    // that line whenever the incoming and outgoing secants differ.
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: -30 },
      { x: 100, y: -10 },
      { x: 150, y: -40 },
      { x: 200, y: 0 }
    ]

    const d = monotoneLinePath(points)
    const segments = parseSegments(d)

    // For a straight polyline, `C` control points would sit exactly on the
    // segment's own start–end line (c1 = p0 + dx/3, c2 = p1 - dx/3 with the
    // *segment's own* slope). Monotone's control points use a tangent
    // blended from the neighbouring secant too, so at least one segment's
    // control point must deviate from that line.
    const onOwnLine = (p0: Point, c: Point, p1: Point): boolean => {
      const expectedY = p0.y + ((c.x - p0.x) / (p1.x - p0.x)) * (p1.y - p0.y)
      return Math.abs(c.y - expectedY) < 1e-9
    }

    const anyCurved = segments.some(
      ([p0, c1, c2, p1]) => !onOwnLine(p0, c1, p1) || !onOwnLine(p0, c2, p1)
    )
    expect(anyCurved).toBe(true)
  })

  it('handles the degenerate cases a chart with too few points could hit', () => {
    expect(monotoneLinePath([])).toBe('')
    expect(monotoneLinePath([{ x: 1, y: 2 }])).toBe('M1,2')
    expect(monotoneLinePath([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe('M1,2L3,4')
  })
})
