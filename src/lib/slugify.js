/**
 * Converts a restaurant name to a URL-safe ASCII slug.
 * e.g. "Café Noir" -> "cafe-noir"
 */
export function toSlug(name) {
  return (name || '')
    .normalize('NFD')                   // decompose accents: é -> e + ́
    .replace(/[\u0300-\u036f]/g, '')    // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')       // replace non-alphanumeric with -
    .replace(/^-+|-+$/g, '');           // trim leading/trailing dashes
}