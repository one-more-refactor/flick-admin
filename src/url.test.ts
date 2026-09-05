import { describe, expect, it } from 'bun:test';
import { validateLink } from './main';

describe('validateLink', () => {
  it('allows valid http, https, and relative URLs', () => {
    expect(validateLink('http://example.com')).toBe('http://example.com');
    expect(validateLink('https://example.com/path?a=1#b')).toBe('https://example.com/path?a=1#b');
    expect(validateLink('/announcement/details')).toBe('/announcement/details');
  });

  it('handles empty or non-string inputs', () => {
    expect(validateLink('')).toBe('');
    expect(validateLink(null)).toBe('');
    expect(validateLink(undefined)).toBe('');
  });

  it('rejects javascript: and obfuscated javascript: URLs with control characters', () => {
    expect(() => validateLink('javascript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('java\x00script:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('java\tscript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('java\r\nscript:alert(1)')).toThrow('Invalid URL format');
  });

  it('rejects other unsafe protocols like data: or vbscript:', () => {
    expect(() => validateLink('data:text/html,<script>alert(1)</script>')).toThrow('Invalid URL format');
    expect(() => validateLink('vbscript:msgbox(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('ftp://example.com')).toThrow('Invalid URL format');
  });
});
