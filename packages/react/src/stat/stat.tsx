import type {HTMLAttributes, ReactNode} from 'react';

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: string;
  sub?: string;
}

export function Stat({value, label, sub, className, ...props}: StatProps): React.JSX.Element {
  return (
    <div {...props} className={className === undefined ? 'lat-stat' : `lat-stat ${className}`}>
      <div className="lat-stat__value">{value}</div>
      <div className="lat-stat__label">{label}</div>
      {sub === undefined ? null : <div className="lat-stat__sub">{sub}</div>}
    </div>
  );
}
