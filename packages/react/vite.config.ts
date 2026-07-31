import { defineConfig } from 'vite'

// No @vitejs/plugin-react. Vite transpiles .tsx with esbuild using the jsx
// setting from tsconfig.json, and the plugin's only additions here would be
// Fast Refresh and the React Compiler — neither of which a Playwright target
// needs, against three more peer dependencies.
export default defineConfig({
  root: 'demo',
  server: {
    port: 5173,
    strictPort: true
  }
})
