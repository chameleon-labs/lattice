// A side-effect stylesheet import has no type of its own. The wildcard matches
// a package subpath as well as a relative path, which is what covers
// '@chameleon-labs/lattice-tokens/lattice.css'.
declare module '*.css'

// `import.meta.glob` is Vite's, and Storybook builds this preview with Vite.
// Declared here rather than by adding "vite/client" to tsconfig types, which
// would pull DOM ambient declarations into every file the config covers.
interface ImportMeta {
  glob: (pattern: string, options?: { eager?: boolean }) => Record<string, unknown>
}
