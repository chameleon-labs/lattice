# Table

`Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` over native table elements.

```tsx
<Table caption="Audit history">
  <THead>
    <Tr><Th scope="col">Date</Th><Th scope="col">Score</Th></Tr>
  </THead>
  <TBody>
    <Tr><Th scope="row">30 July</Th><Td>72</Td></Tr>
  </TBody>
</Table>
```

| Prop | Type | Notes |
|---|---|---|
| `Table.caption` | `string` | **Required** |
| `Table.visuallyHiddenCaption` | `boolean` | Keeps the caption as the accessible name while hiding it |
| `Th.scope` | `col` \| `row` | **Required** |

Both required props are the point. A missing caption and a header cell that does
not say what it heads are the two commonest table defects, and both are
invisible in review — so each omission is a compile error rather than an audit
finding. Both are asserted with `@ts-expect-error`, so loosening either breaks
the build.

Presentational only: no sorting, selection or grid navigation. A sortable header
is a different accessibility contract and should arrive with its consumer.

**Classes:** `.lat-table`, `.lat-table__caption`, `.lat-table__head`,
`.lat-table__body`, `.lat-table__row`, `.lat-table__header`, `.lat-table__cell`.
