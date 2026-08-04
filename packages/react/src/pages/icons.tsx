import type { SVGProps } from 'react'

/**
 * The page-local icon set.
 *
 * This package takes no icon dependency — the two page stories draw their own
 * inline SVGs from lucide's path data rather than importing `lucide-react`.
 * Every icon here sits beside a text label and carries no meaning of its own,
 * so each defaults to `aria-hidden="true"` and inherits `currentColor` rather
 * than fixing its own colour.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'fill' | 'stroke'> {
  size?: number
}

function iconProps({ size = 16, ...props }: IconProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    width: size,
    height: size,
    'aria-hidden': 'true' as const,
    ...props
  }
}

export function Copy(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

export function Check(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function ChevronRight(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function Circle(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

export function Square(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  )
}

export function Triangle(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M13.73 4a2 2 0 0 0-3.46 0L2.71 18a2 2 0 0 0 1.73 3h15.14a2 2 0 0 0 1.73-3Z" />
    </svg>
  )
}

export function Sun(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

export function Moon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export function Zap(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  )
}
