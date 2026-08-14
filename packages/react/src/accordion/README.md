# Accordion

`Accordion` and `AccordionItem` — a set of panels whose headers are real
headings.

```tsx
<Accordion headingLevel={3}>
  <AccordionItem label="Colour contrast">Thirteen nodes fail the 4.5:1 minimum.</AccordionItem>
  <AccordionItem label="Landmarks">Two regions share a role and a name.</AccordionItem>
</Accordion>
```

| Prop | Values | Default |
|---|---|---|
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` — **required** | — |
| `single` | `boolean`, opening one closes the others | `false` |

**Why it exists:** a stack of [`Disclosure`](../disclosure/README.md)s is not an
accordion, and the difference is the heading.

The APG pattern puts each trigger inside an `<h2>`–`<h6>` matching the document
outline, because that is how a screen-reader user moves through a set of
panels — by heading, not by tabbing every trigger in turn. It is the most
skipped part of the pattern and the skip is invisible: the accordion still
opens, still animates, still passes a casual review.

`headingLevel` is therefore **required, with no default**. A default of `3`
would be worse than none: right often enough to look fine, and wrong exactly
where a page's outline is unusual, which is the case nobody checks.

The button goes *inside* the heading, not the heading inside the button, so
navigating by heading lands on the text. `tests/browser/accordion.spec.ts`
asserts the level through the accessibility tree rather than the tag, so an
`<h5>` the browser exposed as a generic would fail.

`defaultOpen` works under `single` too: the first item in DOM order that asks
for it gets the slot, and later claimants find it taken.

## Independent by default

`single` is off. Collapsing a panel the reader opened deliberately is a
surprise, so exclusivity is the behaviour to opt into.

## No `role="region"` on the panel

APG lists it as optional and warns against it when there are many panels: each
becomes a landmark, and a long accordion floods the landmark list with entries
nobody wanted. The panel is associated with its header by `aria-controls` and
`aria-expanded`, which is the part that carries the relationship.

## The header brings its own geometry

The trigger renders `bare`, so `.lat-disclosure`'s ghost-button chrome —
inline-flex, hairline border, sized to its label — never lands on it to be
fought. An accordion header is a full-width row; see
[#87](https://github.com/chameleon-labs/lattice/issues/87) for what happens
when a wrapper's appearance is imposed rather than declined.

The chevron is drawn in CSS rather than shipped as an icon, in `currentColor`
so it survives `forced-colors`.

**Classes:** `.lat-accordion`, `.lat-accordion__item`, `.lat-accordion__heading`,
`.lat-accordion__trigger`, `.lat-accordion__panel`.
