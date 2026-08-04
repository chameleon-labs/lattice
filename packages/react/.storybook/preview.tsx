import type { Decorator, Preview } from '@storybook/react-vite'
import { useLayoutEffect } from 'react'

// The token stylesheet first: every component value is a var() reference into
// it, so it has to be present before the component stylesheet is applied.
import '@chameleon-labs/lattice-tokens/lattice.css'
import '../src/styles.css'
import './preview.css'

/**
 * The theme is a Storybook global rather than a story per mode.
 *
 * A global is addressable from the URL —
 * `/iframe.html?id=…&globals=theme:dark` — which is what lets the accessibility
 * sweep visit every story in both modes without the story count doubling. Two
 * stories per component would put the burden back on whoever adds the next one.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = String(context.globals['theme'] ?? 'light')

  // Ariakit components that portal — Dialog today, Menu and others later —
  // render their content as a sibling of this wrapper once mounted, appended
  // straight onto <body>, not as its descendant. `.lat-surface` and
  // `data-lat-theme` scoped only to the wrapper div would leave that portalled
  // content both unstyled (base.css's `:where()` selectors never match it) and
  // unthemed (the token redefinitions live behind `[data-lat-theme]`). Per
  // base.css's own rule — "a consumer who does own the page puts the class on
  // <body>" — and Storybook owns this iframe page outright, so the class and
  // attribute go on <body> as well, not instead of the wrapper.
  useLayoutEffect(() => {
    document.body.classList.add('lat-surface')
    document.body.dataset['latTheme'] = theme
  }, [theme])

  return (
    <div className="lat-story lat-surface" data-lat-theme={theme}>
      <Story />
    </div>
  )
}

const preview: Preview = {
  decorators: [withTheme],

  globalTypes: {
    theme: {
      description: 'Which Lattice theme scope wraps the story',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    }
  },

  // Storybook 9 moved the default off `globalTypes.defaultValue`, which is now
  // ignored. Without this the first render has no theme attribute at all.
  initialGlobals: {
    theme: 'dark'
  },

  parameters: {
    // The decorator paints the surface and owns the padding, so Storybook must
    // not add its own — otherwise the themed element sits as an island on the
    // white canvas and dark mode reads as a rectangle rather than a page.
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
}

export default preview
