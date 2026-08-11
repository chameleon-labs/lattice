import type {ComponentPropsWithRef} from 'react';
import {useState} from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarOptions {
  /** The person. Supplies the initials, and the accessible name unless `decorative`. */
  name: string;
  src?: string;
  /** Overrides the derived initials, for the names the rule gets wrong. */
  initials?: string;
  size?: AvatarSize;
  /**
   * Set when the name is already visible beside this avatar. The whole element
   * leaves the accessibility tree, so the person is announced once, not twice.
   */
  decorative?: boolean;
}

export type AvatarProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & AvatarOptions;

/**
 * First letter of the first word, first letter of the last. One word gives one
 * letter. Deliberately simple: a cleverer rule fails silently on the names it
 * was not written for, and `initials` is the escape hatch when it is wrong.
 *
 * Split on code points, not UTF-16 units, so an astral character stays whole.
 *
 * Cased without a locale: `toLocaleUpperCase` would render the same name
 * differently on a Turkish host than on an English one.
 */
export function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '';
  }

  const first = [...words[0]!][0] ?? '';
  const last = words.length > 1 ? ([...words[words.length - 1]!][0] ?? '') : '';

  return `${first}${last}`.toUpperCase();
}

export function Avatar({
  name,
  src,
  initials,
  size = 'md',
  decorative = false,
  className,
  ...props
}: AvatarProps): React.JSX.Element {
  // Keyed by the src it describes, so a new src is attempted rather than
  // inheriting the previous one's failure.
  const [result, setResult] = useState<{src: string; status: 'loaded' | 'failed'}>();
  const status = result !== undefined && result.src === src ? result.status : undefined;

  return (
    <span
      {...props}
      className={className === undefined ? 'lat-avatar' : `lat-avatar ${className}`}
      data-size={size}
      {...(decorative ? {'aria-hidden': true} : {role: 'img', 'aria-label': name})}
    >
      <span className="lat-avatar__initials" aria-hidden="true" data-covered={status === 'loaded' ? '' : undefined}>
        {initials ?? initialsFrom(name)}
      </span>
      {src === undefined || status === 'failed' ? null : (
        <img
          className="lat-avatar__image"
          src={src}
          alt=""
          onLoad={() => {
            setResult({src, status: 'loaded'});
          }}
          onError={() => {
            setResult({src, status: 'failed'});
          }}
        />
      )}
    </span>
  );
}
