import type { Decorator, Preview } from '@storybook/react-vite'

// The token stylesheet first: every component value is a var() reference into
// it, so it has to be present before the component stylesheet is applied.
import '@chameleon-labs/lattice-tokens/lattice.css'
import '../src/styles.css'
import './preview.css'

/**
 * Every stylesheet in directions/ is loaded, and its filename is the direction's
 * name. Adding a direction is adding a file — nothing here enumerates them,
 * which is the same guarantee the sweep makes about stories.
 *
 * The Playwright side reads the same directory with readdirSync. Two readers,
 * one directory, so they cannot drift about which directions exist.
 */
const directionStyles = import.meta.glob('./directions/*.css', { eager: true })

const DIRECTIONS = [
  // Not a file: the system exactly as it ships, and the control the candidates
  // are judged against.
  'none',
  ...Object.keys(directionStyles)
    .map((path) => path.slice('./directions/'.length).replace(/\.css$/, ''))
    .sort()
]

/**
 * The theme is a Storybook global rather than a story per mode.
 *
 * A global is addressable from the URL —
 * `/iframe.html?id=…&globals=theme:dark` — which is what lets the accessibility
 * sweep visit every story in both modes without the story count doubling. Two
 * stories per component would put the burden back on whoever adds the next one.
 */
const withTheme: Decorator = (Story, context) => (
  <div
    className="lat-story"
    data-lat-theme={String(context.globals['theme'] ?? 'light')}
    data-lat-direction={String(context.globals['direction'] ?? 'none')}
  >
    <Story />
  </div>
)

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
    },

    direction: {
      description: 'Which candidate visual direction the story renders in',
      toolbar: {
        title: 'Direction',
        icon: 'paintbrush',
        items: DIRECTIONS.map((value) => ({
          value,
          title:
            value === 'none' ? 'None (shipped)' : value.charAt(0).toUpperCase() + value.slice(1)
        })),
        dynamicTitle: true
      }
    }
  },

  // Storybook 9 moved the default off `globalTypes.defaultValue`, which is now
  // ignored. Without this the first render has no theme attribute at all.
  initialGlobals: {
    theme: 'light',
    direction: 'none'
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
