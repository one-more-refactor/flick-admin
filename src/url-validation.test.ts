// @ts-ignore
import { describe, expect, test } from 'bun:test';
import { validateUrl } from './main';

describe('validateUrl', () => {
  test('allows valid http and https URLs', () => {
    expect(validateUrl('https://example.com')).toBe('https://example.com');
    expect(validateUrl('http://example.com/path?q=1')).toBe('http://example.com/path?q=1');
  });

  test('allows valid relative URLs', () => {
    expect(validateUrl('/announcements/1')).toBe('/announcements/1');
  });

  test('returns empty string for empty input', () => {
    expect(validateUrl('')).toBe('');
    expect(validateUrl('   ')).toBe('');
  });

  test('strips control characters and null bytes', () => {
    expect(validateUrl('\x00https://example.com')).toBe('https://example.com');
  });

  test('rejects javascript: URLs', () => {
    expect(() => validateUrl('javascript:alert(1)')).toThrow();
    expect(() => validateUrl('  javascript:alert(1)  ')).toThrow();
  });

  test('rejects javascript: URLs with null bytes or control characters', () => {
    expect(() => validateUrl('java\x00script:alert(1)')).toThrow();
    expect(() => validateUrl('java\tscript:alert(1)')).toThrow();
    expect(() => validateUrl('java\r\nscript:alert(1)')).toThrow();
  });

  test('rejects data: and vbscript: URLs', () => {
    expect(() => validateUrl('data:text/html,<script>alert(1)</script>')).toThrow();
    expect(() => validateUrl('vbscript:msgbox("XSS")')).toThrow();
  });

  test('rejects unsupported protocols and relative paths without leading slash', () => {
    expect(() => validateUrl('ftp://example.com')).toThrow();
    expect(() => validateUrl('example.com')).toThrow();
  });
});
