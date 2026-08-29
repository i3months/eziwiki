import { describe, expect, it } from 'vitest';
import { isLightColor, isSafeCssColor } from './color';

describe('isLightColor', () => {
  it('reads a pale section tint as light', () => {
    expect(isLightColor('#fef3c7')).toBe(true);
    expect(isLightColor('#dbeafe')).toBe(true);
  });

  it('reads a saturated colour as dark', () => {
    expect(isLightColor('#1e3a8a')).toBe(false);
    expect(isLightColor('#000000')).toBe(false);
  });

  it('expands 3-digit shorthand instead of misreading it as dark', () => {
    expect(isLightColor('#fff')).toBe(true);
    expect(isLightColor('#000')).toBe(false);
  });

  it('ignores an alpha channel', () => {
    expect(isLightColor('#ffffff80')).toBe(true);
    expect(isLightColor('#0008')).toBe(false);
  });

  it('tolerates a missing hash and surrounding whitespace', () => {
    expect(isLightColor('fef3c7')).toBe(true);
    expect(isLightColor(' #000000 ')).toBe(false);
  });

  it('measures rgb() and rgba() notation', () => {
    expect(isLightColor('rgb(255, 255, 255)')).toBe(true);
    expect(isLightColor('rgb(0, 0, 0)')).toBe(false);
    expect(isLightColor('rgba(20, 20, 20, 0.9)')).toBe(false);
  });

  it('keeps the historical dark guess for anything it cannot measure', () => {
    // "navy" painted a dark background and got light ink before this function
    // existed; the fallback must not flip sites where that guess was right.
    expect(isLightColor('navy')).toBe(false);
    expect(isLightColor('lightyellow')).toBe(false);
    expect(isLightColor('')).toBe(false);
  });
});

// Mid-tones are where a brightness midpoint went wrong: on #808080 dark ink
// reaches 2.6:1 and light ink 3.6:1.
describe('isLightColor on mid-tones', () => {
  it('puts light ink on a mid grey', () => {
    expect(isLightColor('#808080')).toBe(false);
  });

  it('puts dark ink on a bright orange', () => {
    expect(isLightColor('#f97316')).toBe(true);
  });
});

// The value lands in a style attribute, where a semicolon starts a second
// declaration.
describe('isSafeCssColor', () => {
  it('accepts the forms a colour takes', () => {
    expect(isSafeCssColor('#fef3c7')).toBe(true);
    expect(isSafeCssColor('#fff')).toBe(true);
    expect(isSafeCssColor('rgb(255, 0, 0)')).toBe(true);
    expect(isSafeCssColor('rgba(20 20 20 / 0.5)')).toBe(true);
    expect(isSafeCssColor('hsl(210, 40%, 96%)')).toBe(true);
    expect(isSafeCssColor('lightyellow')).toBe(true);
  });

  it('refuses anything that is more than a colour', () => {
    expect(isSafeCssColor('red; background: url(https://evil.example/x)')).toBe(false);
    expect(isSafeCssColor('url(x)')).toBe(false);
    expect(isSafeCssColor('#fff}')).toBe(false);
    expect(isSafeCssColor('')).toBe(false);
  });
});
