/**
 * Decides whether a background colour is light — that is, whether text drawn
 * over it needs to be dark to stay readable.
 *
 * Section colours come from `_meta.json` and frontmatter, which nothing
 * validates, so this has to survive whatever an author writes. Hex in every
 * length and `rgb()` are measured; a named colour cannot be without a DOM,
 * and is treated as dark — not because that guess is better, but because it
 * is the guess this function has always made, and flipping it would re-ink
 * every existing site where it happens to be right.
 *
 * @param color - CSS colour as written by the author, ideally `#rrggbb`
 * @returns true when dark text belongs on this colour
 */
export function isLightColor(color: string): boolean {
  const value = color.trim();

  const rgb = value.match(/^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,)/]/i);
  if (rgb) return isLightRgb(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));

  const hex = value.replace(/^#/, '');

  // #rgb and #rgba double each digit; 8-digit hex just carries alpha, which
  // luminance ignores — both land on the first six digits below.
  const expanded = hex.length === 3 || hex.length === 4 ? [...hex].map((c) => c + c).join('') : hex;

  const r = parseInt(expanded.substring(0, 2), 16);
  const g = parseInt(expanded.substring(2, 4), 16);
  const b = parseInt(expanded.substring(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;

  return isLightRgb(r, g, b);
}

/**
 * Whether dark ink reads better on this colour than light ink.
 *
 * Decided by WCAG contrast against the two inks the menus actually use —
 * gray-700 and gray-100 — rather than a brightness midpoint, which put dark
 * ink on mid-greys and oranges where it reached 2.6:1.
 */
function isLightRgb(r: number, g: number, b: number): boolean {
  const l = luminance(r, g, b);
  const onDark = (l + 0.05) / (DARK_INK + 0.05);
  const onLight = (LIGHT_INK + 0.05) / (l + 0.05);
  return onDark >= onLight;
}

/** Relative luminance of gray-700 (#374151) and gray-100 (#f3f4f6). */
const DARK_INK = luminance(55, 65, 81);
const LIGHT_INK = luminance(243, 244, 246);

/** Relative luminance as WCAG defines it. */
function luminance(r: number, g: number, b: number): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Whether a colour is safe to place in an inline style.
 *
 * A section's colour comes from `_meta.json` or frontmatter, which a
 * contributor can write, and it lands in a `style` attribute. React escapes
 * the quotes but not a semicolon, so `red; background: url(https://…)` used
 * to become a second declaration — a beacon reporting every reader, or an
 * overlay drawn over the page. Only the forms a colour can take are let
 * through: hex, `rgb()`/`hsl()` of numbers, or a bare name.
 *
 * @param color - The value as written
 * @returns true when it is a colour and nothing more
 */
export function isSafeCssColor(color: string): boolean {
  const value = color.trim();
  return (
    /^#[0-9a-f]{3,8}$/i.test(value) ||
    /^(rgb|hsl)a?\(\s*[\d.]+%?(\s*[,/\s]\s*[\d.]+%?){2,3}\s*\)$/i.test(value) ||
    /^[a-z]{3,30}$/i.test(value)
  );
}
