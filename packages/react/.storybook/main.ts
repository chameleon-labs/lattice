import type {StorybookConfig} from '@storybook/react-vite';

/**
 * Stories are co-located with the component they document, so the two move
 * together and "does this family have stories?" is answered by listing a
 * directory.
 *
 * That co-location is why `tsconfig.build.json` carries an exclude: the emit
 * config has `rootDir: "src"`, so without one every story would compile into
 * dist/ and ship to consumers.
 */
const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    // Playwright boots this on every browser-test run, including in CI. A
    // network call on start-up is latency the suite pays for nothing.
    disableTelemetry: true,
  },
  stories: ['../src/**/*.stories.tsx'],
  addons: [
    // Prop tables and story source, generated from the component's actual
    // signature rather than written a second time by hand.
    '@storybook/addon-docs',
    // Developer feedback in the sidebar panel. This is *not* the gate — the
    // gate is the Playwright sweep in tests/browser/a11y.spec.ts, which runs in
    // CI at two root font sizes and in both themes.
    '@storybook/addon-a11y',
  ],
};

export default config;
