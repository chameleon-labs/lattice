import type {ComponentPropsWithRef, HTMLAttributes, ReactNode} from 'react';

export type CardProps = ComponentPropsWithRef<'div'>;

/**
 * A `--lat-bg-raised` surface with a hairline border. Flat by default — no
 * shadow — with `data-elevation="floating"` as the escape hatch for the rare
 * instance that needs one, such as the Figma bundle's hero audit card.
 *
 * The hairline, not the shadow, is the edge that survives `forced-colors`,
 * where the user agent strips shadows and flattens surfaces to the system
 * canvas — the shadow is the enhancement.
 *
 * A card never takes `role="button"`. An interactive card exposes its action
 * through a real control inside it — a link whose hit area is stretched in CSS
 * — which keeps one accessible name and one tab stop instead of two.
 */
export function Card({className, ...props}: CardProps): React.JSX.Element {
  return <div {...props} className={className === undefined ? 'lat-card' : `lat-card ${className}`} />;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** The eyebrow label. Every panel in Lattice carries one. */
  label: string;
  /** An optional leading icon, rendered before the label. */
  icon?: ReactNode;
}

export function CardHeader({label, icon, children, className, ...props}: CardHeaderProps): React.JSX.Element {
  return (
    <div {...props} className={className === undefined ? 'lat-card__header' : `lat-card__header ${className}`}>
      {icon}
      <span className="lat-card__label">{label}</span>
      {children}
    </div>
  );
}

export type CardBodyProps = HTMLAttributes<HTMLDivElement>;

export function CardBody({className, ...props}: CardBodyProps): React.JSX.Element {
  return <div {...props} className={className === undefined ? 'lat-card__body' : `lat-card__body ${className}`} />;
}
