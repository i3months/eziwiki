import { describe, expect, it } from 'vitest';
import { jsonLd } from './jsonLd';

describe('jsonLd', () => {
  it('cannot close the script element it is placed in', () => {
    const out = jsonLd({ headline: 'x</script><script>alert(1)</script>' });

    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
    expect(JSON.parse(out)).toEqual({ headline: 'x</script><script>alert(1)</script>' });
  });

  it('escapes the line separators and leaves ordinary text alone', () => {
    expect(jsonLd('a\u2028b')).toBe('"a\\u2028b"');
    expect(jsonLd({ a: 'plain & simple' })).toBe('{"a":"plain \\u0026 simple"}');
    expect(JSON.parse(jsonLd({ a: 'plain & simple' }))).toEqual({ a: 'plain & simple' });
  });
});
