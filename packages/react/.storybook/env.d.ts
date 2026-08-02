// A side-effect stylesheet import has no type of its own. The wildcard matches
// a package subpath as well as a relative path, which is what covers
// '@chameleon-labs/lattice-tokens/lattice.css'.
declare module '*.css'
