# Tooltip

`TooltipProvider`, `TooltipAnchor`, and `Tooltip`.

```tsx
<TooltipProvider>
  <TooltipAnchor render={<AddonButton label="Copy page URL"><CopyIcon /></AddonButton>} />
  <Tooltip>Copies the audited URL to your clipboard</Tooltip>
</TooltipProvider>
```

## Read this before using it

**The tooltip text is not announced.** Ariakit associates nothing — no
`aria-describedby` — and as of 0.4 it deprecated the association it used to
offer, on the grounds that a trigger must carry its own name and a tooltip is
supplementary. Attempting to wire the description anyway does not survive:
Ariakit strips the attribute, and the surface is mounted lazily, so an id would
point at nothing until the tooltip first opened.

**So nothing may live only in a tooltip.** There is no hover on touch and no
press affordance either, so a phone never shows it. If a fact appears nowhere
else, the design is wrong and this component will not rescue it.

That is a rule, not a mechanism — the one component here that ships with one.
Everything else in this package enforces its guarantee. This cannot, and saying
so is the honest version.

## What it does guarantee

**It can never become the accessible name.** The `type` option is omitted from
`TooltipProviderProps`, so Ariakit's deprecated `label` mode is unreachable.
[`AddonButton`](../addon-button/README.md) requires a `label` precisely so an
icon-only control names itself; a tooltip able to supply that name would undo it
from the other side. The trigger must already have a name — that is the
component's job, not this one's.

**WCAG 1.4.13, all three parts.** Content on hover or focus must be
*dismissable* without moving the pointer, *hoverable*, and *persistent*.
`tests/browser/tooltip.spec.ts` asserts each: Escape closes it, the pointer can
travel onto it, and it does not time out while the trigger holds focus. That is
what Ariakit is wrapped for.

**It works on a disabled trigger.** A natively `disabled` button fires no
pointer or focus events, so its tooltip never opens — exactly where an
explanation is wanted most. Pair it with Ariakit's `accessibleWhenDisabled`,
which keeps the control focusable and marks it `aria-disabled`, as
`AddonButton` already defaults to.

## Not for interactive content

A link or button inside a tooltip is unreachable: it is not in the tab order,
and moving toward it dismisses the thing. That shape is a popover.

**Classes:** `.lat-tooltip`, `.lat-tooltip-anchor`. The surface takes the
`overlay` elevation role it shares with `Menu` and `Dialog` — hairline plus
shadow, the hairline being what survives `forced-colors`.
