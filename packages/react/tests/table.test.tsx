import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TBody, THead, Table, Td, Th, Tr } from '../src/table/table.js'

const history = (
  <Table caption="Audit history">
    <THead>
      <Tr>
        <Th scope="col">Date</Th>
        <Th scope="col">Score</Th>
      </Tr>
    </THead>
    <TBody>
      <Tr>
        <Th scope="row">30 July</Th>
        <Td>72</Td>
      </Tr>
    </TBody>
  </Table>
)

describe('Table', () => {
  it('renders the caption as a real <caption>', () => {
    render(history)
    const caption = screen.getByText('Audit history')

    expect(caption.closest('caption')).not.toBeNull()
  })

  it('takes its accessible name from the caption', () => {
    render(history)

    expect(screen.getByRole('table', { name: 'Audit history' })).toBeDefined()
  })

  it('keeps a visually hidden caption in the accessibility tree', () => {
    render(
      <Table caption="Audit history" visuallyHiddenCaption>
        <TBody>
          <Tr>
            <Td>72</Td>
          </Tr>
        </TBody>
      </Table>
    )

    // Still the accessible name, even though it is not visible.
    expect(screen.getByRole('table', { name: 'Audit history' })).toBeDefined()
  })

  it('gives every header cell a scope', () => {
    render(history)

    for (const header of screen.getAllByRole('columnheader')) {
      expect(header.getAttribute('scope')).toBe('col')
    }
    expect(screen.getByRole('rowheader').getAttribute('scope')).toBe('row')
  })

  it('renders rows and cells with their own classes', () => {
    const { container } = render(history)

    expect(container.querySelector('.lat-table')).not.toBeNull()
    expect(container.querySelector('.lat-table__header')).not.toBeNull()
    expect(container.querySelector('.lat-table__cell')).not.toBeNull()
  })
})

/*
 * The two guarantees are type-level, so they are asserted by the compiler
 * rather than at runtime. `@ts-expect-error` fails `pnpm typecheck` if the
 * error it names ever stops occurring — so if `caption` or `scope` were made
 * optional, this file would stop compiling.
 */
export function TypeAssertions() {
  return (
    <>
      {/* @ts-expect-error caption is required */}
      <Table>
        <TBody />
      </Table>

      <Table caption="Fine">
        <THead>
          <Tr>
            {/* @ts-expect-error scope is required on a header cell */}
            <Th>Date</Th>
          </Tr>
        </THead>
      </Table>
    </>
  )
}
