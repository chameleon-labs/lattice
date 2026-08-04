import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from '../src/input/input.js'
import { TextField } from '../src/text-field/text-field.js'

describe('Input', () => {
  it('is not invalid by default', () => {
    render(<Input aria-label="URL" />)
    const input = screen.getByLabelText('URL')

    expect(input.getAttribute('aria-invalid')).toBeNull()
  })

  it('maps invalid to aria-invalid', () => {
    render(<Input aria-label="URL" invalid />)

    expect(screen.getByLabelText('URL').getAttribute('aria-invalid')).toBe('true')
  })

  // There is no size prop: every field in the source design renders at
  // one size, so this system doesn't offer a knob the design never turns.
  it('does not accept a size prop', () => {
    render(<Input aria-label="URL" />)
    const input = screen.getByLabelText('URL')

    expect(input.dataset['size']).toBeUndefined()
  })

  // className moved from the <input> to the wrapper it always renders inside
  // — the wrapper is the box a caller positions or sizes, since it is now
  // the element carrying the border and background.
  it('adds className to the wrapper, not the control', () => {
    render(<Input aria-label="URL" className="mine" />)
    const input = screen.getByLabelText('URL')
    const wrapper = input.parentElement as HTMLElement

    expect(wrapper.classList.contains('lat-input-field')).toBe(true)
    expect(wrapper.classList.contains('mine')).toBe(true)
    expect(input.classList.contains('mine')).toBe(false)
  })

  it('always renders the field wrapper, addons or not', () => {
    render(<Input aria-label="URL" />)
    const input = screen.getByLabelText('URL')

    expect(input.parentElement?.classList.contains('lat-input-field')).toBe(true)
  })

  it('renders addonStart before the control and addonEnd after it', () => {
    render(
      <Input
        aria-label="URL"
        addonStart={<span data-testid="start">start</span>}
        addonEnd={<span data-testid="end">end</span>}
      />
    )
    const input = screen.getByLabelText('URL')
    const wrapper = input.parentElement as HTMLElement
    const children = Array.from(wrapper.children)

    expect(children.indexOf(screen.getByTestId('start'))).toBe(0)
    expect(children.indexOf(input)).toBe(1)
    expect(children.indexOf(screen.getByTestId('end'))).toBe(2)
  })

  it('reflects invalid onto the wrapper as data-invalid, while aria-invalid stays on the control', () => {
    render(<Input aria-label="URL" invalid />)
    const input = screen.getByLabelText('URL')
    const wrapper = input.parentElement as HTMLElement

    expect(wrapper.dataset['invalid']).toBe('true')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('omits data-invalid from the wrapper when not invalid', () => {
    render(<Input aria-label="URL" />)
    const wrapper = screen.getByLabelText('URL').parentElement as HTMLElement

    expect(wrapper.dataset['invalid']).toBeUndefined()
  })

  it('reflects disabled onto the wrapper as data-disabled', () => {
    render(<Input aria-label="URL" disabled />)
    const input = screen.getByLabelText('URL')
    const wrapper = input.parentElement as HTMLElement

    expect(wrapper.dataset['disabled']).toBe('true')
    expect((input as HTMLInputElement).disabled).toBe(true)
  })

  it('omits data-disabled from the wrapper when enabled', () => {
    render(<Input aria-label="URL" />)
    const wrapper = screen.getByLabelText('URL').parentElement as HTMLElement

    expect(wrapper.dataset['disabled']).toBeUndefined()
  })

  // The ref stays pinned to the <input>, not the wrapper the field chrome
  // moved onto — InputProps is ComponentPropsWithRef<'input'> and callers
  // (focus management, form libraries) rely on that.
  it('resolves a ref to the <input>, not the wrapper', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input aria-label="URL" ref={ref} />)

    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe('INPUT')
    expect(ref.current?.classList.contains('lat-input')).toBe(true)
  })
})

describe('TextField', () => {
  it('associates the label with the input', () => {
    render(<TextField label="Page URL" />)

    // getByLabelText only resolves when htmlFor and id actually match.
    expect(screen.getByLabelText('Page URL')).toBeDefined()
  })

  it('describes the input with the description alone when there is no error', () => {
    render(<TextField label="Page URL" description="We audit the page at this address." />)
    const input = screen.getByLabelText('Page URL')
    const description = screen.getByText('We audit the page at this address.')

    expect(input.getAttribute('aria-describedby')).toBe(description.id)
    expect(input.getAttribute('aria-invalid')).toBeNull()
  })

  it('describes the input with the error and marks it invalid', () => {
    render(<TextField label="Page URL" error="That address can't be audited." />)
    const input = screen.getByLabelText('Page URL')
    const error = screen.getByText("That address can't be audited.")

    expect(input.getAttribute('aria-describedby')).toBe(error.id)
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('lists description then error when both are present', () => {
    render(
      <TextField
        label="Page URL"
        description="We audit the page at this address."
        error="That address can't be audited."
      />
    )
    const input = screen.getByLabelText('Page URL')
    const description = screen.getByText('We audit the page at this address.')
    const error = screen.getByText("That address can't be audited.")

    expect(input.getAttribute('aria-describedby')).toBe(`${description.id} ${error.id}`)
  })

  // The case that matters most. An empty aria-describedby is worse than none:
  // it points assistive technology at nothing.
  it('omits aria-describedby and aria-invalid when there is neither', () => {
    render(<TextField label="Page URL" />)
    const input = screen.getByLabelText('Page URL')

    expect(input.getAttribute('aria-describedby')).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBeNull()
  })

  it('gives two fields on one page distinct ids', () => {
    render(
      <>
        <TextField label="First" description="one" />
        <TextField label="Second" description="two" />
      </>
    )

    const first = screen.getByLabelText('First').getAttribute('aria-describedby')
    const second = screen.getByLabelText('Second').getAttribute('aria-describedby')

    expect(first).not.toBe(second)
  })

  it('carries the error without a live role, so a first render announces nothing', () => {
    render(<TextField label="Page URL" error="That address can't be audited." />)
    const error = screen.getByText("That address can't be audited.")

    expect(error.getAttribute('role')).toBeNull()
    expect(error.getAttribute('aria-live')).toBeNull()
  })
})
