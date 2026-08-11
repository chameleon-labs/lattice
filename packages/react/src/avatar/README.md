# Avatar

`Avatar` — a person's image, and their initials when there isn't one.

```tsx
<Avatar name="Ada Lovelace" src={user.imageUrl} />
<Avatar name="Ada Lovelace" />
<Avatar name="Ada Lovelace" decorative />
```

| Prop | Values | Default |
|---|---|---|
| `name` | `string` — **required** | — |
| `src` | `string` | — |
| `initials` | `string`, overriding the derived pair | derived from `name` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `decorative` | `boolean` | `false` |

**Why it exists:** two things a `src ? <img/> : <span/>` ternary gets wrong.

**The fallback covers a broken image, not just an absent one.** A `src` is far
more often present-but-failing than missing — a 404, a dead CDN, an offline
device, a blocked host. A ternary renders `<img>` for all of those and the
browser paints its own broken-image glyph beside someone's name. The initials
appear whenever the image does not *paint*.

**The name is announced once.** By default the avatar carries `role="img"` and
the name, for when it stands alone in a table cell or a stack. Set `decorative`
when the name is already visible beside it: the whole element leaves the
accessibility tree, rather than announcing the person twice. The `<img>` is
always `alt=""` and the initials always `aria-hidden` — the wrapper is the only
thing that ever speaks.

The default is the labelled one on purpose. Getting it wrong that way is
verbose; the other way is silent.

## The initials rule

First letter of the first word, first letter of the last. One word gives one
letter. Split on code points, so an astral character stays whole.

It is deliberately simple, and it is wrong for some names — particles like
"van der", compound surnames, honorifics, scripts where a leading character is
not what a reader would pick. A cleverer rule fails silently on the names it was
not written for. This one is predictable, and `initials` is the escape hatch.

## No colour from a hash

Deriving a background colour from the name is the usual pattern here, and it
cannot ship in this system. Every colour pair is measured into a contrast
ledger; a generated colour is by construction unmeasured. One treatment, from
tokens — `text on component` is a ledger row like any other.

## Round, in a square system

`--lat-radius-full`, and the only box here that is not square.

Lattice's square radius is part of the identity, so this needs a reason beyond
convention. It is the same one `Switch` has: the shape carries meaning rather
than decorating. A circle reads as a person; a square reads as a logo, a
thumbnail, an asset — a distinction other systems use deliberately, circles for
people and squares for organisations. Rounding here is a signifier doing work,
not a corner softened because it looks nicer.

The identity is also silent on this. The source bundle never drew an avatar, so
there is no square one to be faithful to — the square radius is a rule about
panels, fields and buttons, and it was never asked this question.

**Classes:** `.lat-avatar`, `.lat-avatar__image`, `.lat-avatar__initials`, with
`data-size`.
