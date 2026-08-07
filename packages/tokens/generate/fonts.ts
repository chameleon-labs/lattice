/**
 * `@font-face` rules for the self-hosted families.
 *
 * Both files are variable fonts, so one face per family covers every weight the
 * roles ask for. `font-display: swap` shows fallback text immediately rather
 * than holding the first paint on a font that is part of the identity but not
 * part of the content.
 *
 * The URLs are relative to the emitted stylesheet, so a consumer copying
 * `dist/` wholesale gets working fonts with no build configuration.
 */
export function fontFaceCss(): string {
  return `@font-face {
  font-family: 'Instrument Sans';
  src: url('./fonts/InstrumentSans-Variable.woff2') format('woff2-variations');
  font-weight: 400 700;
  font-stretch: 75% 100%;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('./fonts/JetBrainsMono-Variable.woff2') format('woff2-variations');
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}`;
}
