/** Data attribute placed on the first element of a coloured background band. */
export const BAND_START_ATTR = 'data-mm-band-start-anchor';

/** Data attribute placed on the last element of a coloured background band. */
export const BAND_END_ATTR = 'data-mm-band-end-anchor';

/** Returns the CSS selector that targets a band start anchor with the given key. */
export const bandStartSelector = (key: string): string =>
  `[${BAND_START_ATTR}="${key}"]`;

/** Returns the CSS selector that targets a band end anchor with the given key. */
export const bandEndSelector = (key: string): string =>
  `[${BAND_END_ATTR}="${key}"]`;
