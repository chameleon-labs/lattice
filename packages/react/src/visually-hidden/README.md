# VisuallyHidden

Re-exported from Ariakit **unchanged**.

```tsx
<span>▼ 12<VisuallyHidden> points, down since the previous audit</VisuallyHidden></span>
```

Ariakit's implementation already applies the clip-rect correctly: the element
stays in the accessibility tree and out of view, without the `display: none` or
zero-size mistakes that silently remove it from both.

There is nothing for this system to decide about its appearance, because it has
none. Wrapping it to look consistent with the other families would add a class
that does nothing and one more name to keep in step with an upstream change.
Consistency is not worth a fake wrapper — so this family has no `lat-` class.
