import {useId} from 'react';
import {Input, type InputProps} from '../input/input.js';

export interface TextFieldProps extends Omit<InputProps, 'aria-describedby' | 'aria-invalid'> {
  label: string;
  description?: string;
  error?: string;
}

/**
 * An input with its label, description and error wired together.
 *
 * This wiring is not hard; it is **invisible**. A missing `aria-describedby`
 * looks identical in review to a present one, which is the defect class this
 * product exists to find — so the relationship is built here rather than
 * re-established correctly at every call site.
 */
export function TextField({
  label,
  description,
  error,
  className,
  size = 'md',
  ...props
}: TextFieldProps): React.JSX.Element {
  const base = useId();
  const inputId = `${base}-input`;
  const descriptionId = `${base}-description`;
  const errorId = `${base}-error`;

  // Only ids that were actually rendered. An empty aria-describedby is worse
  // than an absent one: it points assistive technology at nothing.
  const describedBy = [description === undefined ? null : descriptionId, error === undefined ? null : errorId]
    .filter((id): id is string => id !== null)
    .join(' ');

  return (
    <div className={className === undefined ? 'lat-text-field' : `lat-text-field ${className}`} data-size={size}>
      <label className="lat-text-field__label" htmlFor={inputId} data-size={size}>
        {label}
      </label>

      {description === undefined ? null : (
        <p className="lat-text-field__description" id={descriptionId}>
          {description}
        </p>
      )}

      <Input
        {...props}
        size={size}
        id={inputId}
        invalid={error !== undefined}
        {...(describedBy === '' ? {} : {'aria-describedby': describedBy})}
      />

      {/*
        No live role. An error present on first render would announce out of
        context, which is the same reasoning Callout follows.
      */}
      {error === undefined ? null : (
        <p className="lat-text-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
