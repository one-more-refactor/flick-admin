// @ts-nocheck
import { describe, expect, it } from 'bun:test';
import { validateUrl } from './main';

describe('validateUrl', () => {
  it('returns empty string for non-string or empty input', () => {
    expect(validateUrl(null)).toBe('');
    expect(validateUrl(undefined)).toBe('');
    expect(validateUrl('')).toBe('');
    expect(validateUrl('   ')).toBe('');
  });

  it('allows valid http, https, and relative URLs', () => {
    expect(validateUrl('https://example.com')).toBe('https://example.com');
    expect(validateUrl('http://example.com/path?a=1')).toBe('http://example.com/path?a=1');
    expect(validateUrl('/relative/path')).toBe('/relative/path');
  });

  it('strips ASCII control characters and null bytes', () => {
    expect(validateUrl('\x01https://example.com\x07')).toBe('https://example.com');
    expect(validateUrl('  /path\x00/to\x1F  ')).toBe('/path/to');
  });

  it('rejects invalid schemes such as javascript:, data:, and vbscript:', () => {
    expect(() => validateUrl('javascript:alert(1)')).toThrow();
    expect(() => validateUrl('data:text/html,<script>alert(1)</script>')).toThrow();
    expect(() => validateUrl('vbscript:msgbox(1)')).toThrow();
  });

  it('rejects javascript: URLs obfuscated with control characters or whitespace', () => {
    expect(() => validateUrl('java\x00script:alert(1)')).toThrow();
    expect(() => validateUrl('java\x07script:http://example.com')).toThrow();
  });

  it('rejects URLs not starting with http://, https://, or /', () => {
    expect(() => validateUrl('ftp://example.com')).toThrow();
    expect(() => validateUrl('example.com')).toThrow();
  });
});
