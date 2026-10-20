// @ts-ignore
import { describe, expect, test } from 'bun:test';
import { validateAndSanitizeLink } from './url';

describe('validateAndSanitizeLink', () => {
  test('allows empty or blank input', () => {
    expect(validateAndSanitizeLink('')).toBe('');
    expect(validateAndSanitizeLink('   ')).toBe('');
  });

  test('allows valid http, https, and relative URLs', () => {
    expect(validateAndSanitizeLink('https://example.com')).toBe('https://example.com');
    expect(validateAndSanitizeLink('http://example.com/foo?bar=1')).toBe('http://example.com/foo?bar=1');
    expect(validateAndSanitizeLink('/announcements/new')).toBe('/announcements/new');
  });

  test('rejects javascript:, data:, and vbscript: URLs', () => {
    expect(() => validateAndSanitizeLink('javascript:alert(1)')).toThrow();
    expect(() => validateAndSanitizeLink('data:text/html,<script>alert(1)</script>')).toThrow();
    expect(() => validateAndSanitizeLink('vbscript:msgbox(1)')).toThrow();
  });

  test('strips ASCII control characters and null bytes before checking protocol', () => {
    // java\x00script:alert(1) -> javascript:alert(1) which should throw
    expect(() => validateAndSanitizeLink('java\x00script:alert(1)')).toThrow();
    expect(() => validateAndSanitizeLink('java\x07script:alert(1)')).toThrow();
    expect(validateAndSanitizeLink('http\x00s://example.com')).toBe('https://example.com');
  });

  test('rejects invalid URL schemes', () => {
    expect(() => validateAndSanitizeLink('ftp://example.com')).toThrow();
    expect(() => validateAndSanitizeLink('file:///etc/passwd')).toThrow();
    expect(() => validateAndSanitizeLink('relative-without-slash')).toThrow();
  });
});
