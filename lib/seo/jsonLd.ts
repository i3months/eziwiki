/**
 * Serialises structured data for an inline `<script type="application/ld+json">`.
 *
 * `JSON.stringify` alone is not safe there. The parser ends a script element
 * at the first `</script>` it sees, whatever the JSON thinks, so a page whose
 * frontmatter title was `x</script><script>alert(1)</script>` closed the data
 * block and ran what followed — and a title is something a contributor
 * writes. Escaping the angle brackets and ampersand as `\uXXXX` sequences
 * keeps the JSON identical to a parser and inert to the HTML one; the two
 * line separators are escaped as well, since older JavaScript engines choke
 * on them raw.
 *
 * @param value - The structured data
 * @returns JSON that can be placed inside a script element as-is
 */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
