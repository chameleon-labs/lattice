# Code

`Code` — a code fragment inside running text.

```tsx
<p>
  Set <Code>lang</Code> on the <Code>&lt;html&gt;</Code> element.
</p>
```

No props of its own. It takes everything `<code>` takes.

`CodeBlock` is the standalone, copyable listing; this is the other half, and
they are not one component wearing a prop. A block owns a scroll container, a
copy button and a live region. An inline fragment has to flow with the sentence
around it and take part in its line breaking.

That breaking is the guarantee. A selector like `meta[name="viewport"]` or
`div.iana-header > a.more-link` is a single unbroken token as far as the
line-breaking algorithm is concerned, so an inline element that refuses to break
pushes its container wider than the page — a horizontal scrollbar on the whole
document, appearing only at the viewport widths and font sizes where that
particular string happens not to fit. `overflow-wrap: anywhere` lets it break,
and `anywhere` rather than `break-word` so the browser also counts the fragment
when choosing where to break the rest of the line.

Padding is inline-only. Block padding on an inline element does not grow the
line box, so a vertical value overlaps the lines above and below instead of
spacing them.

There is no `variant`. Every colour a caller might reach for here would be a
status this component is not entitled to assert — a failing selector is the
surrounding component's judgement, not the fragment's.

**Classes:** `.lat-code`.
