import { describe, expect, it } from 'vitest';
import { validatePayload } from './validator';
import { payload } from '../../payload/config';

const minimal = { global: { title: 'Wiki', description: 'A wiki' } };

describe('validatePayload', () => {
  it('accepts this repository’s own configuration', () => {
    expect(validatePayload(payload)).toEqual({ valid: true });
  });

  it('accepts the smallest configuration there is', () => {
    expect(validatePayload(minimal)).toEqual({ valid: true });
  });

  it('names an unknown key as the author wrote it', () => {
    // A misspelt key used to be ignored, and the site quietly did not do
    // what the config said.
    const result = validatePayload({ global: { ...minimal.global, urlStrateg: 'path' } });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['global.urlStrateg is not a setting']);
  });

  it('names the setting a bad value sits at', () => {
    const result = validatePayload({ ...minimal, theme: { primary: 'red' } });

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toMatch(/^theme\.primary must match pattern/);
  });

  it('accepts the documented editUrl shape', () => {
    const editUrl = 'https://git.example.com/wiki/-/edit/main/content/{path}';
    expect(validatePayload({ global: { ...minimal.global, editUrl } }).valid).toBe(true);
    expect(validatePayload({ global: { ...minimal.global, editUrl: 'https://x/y' } }).valid).toBe(
      false,
    );
  });
});
