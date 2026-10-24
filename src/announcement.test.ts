import { describe, expect, test } from 'bun:test';
import { validateLink } from './main';

describe('validateLink', () => {
  test('allows empty links', () => {
    expect(validateLink('')).toBe('');
    expect(validateLink(null)).toBe('');
    expect(validateLink(undefined)).toBe('');
  });

  test('allows valid http, https, and relative links', () => {
    expect(validateLink('https://example.com')).toBe('https://example.com');
    expect(validateLink('http://example.com/path?a=1')).toBe('http://example.com/path?a=1');
    expect(validateLink('/announcement/123')).toBe('/announcement/123');
    expect(validateLink('//cdn.example.com/file')).toBe('//cdn.example.com/file');
  });

  test('rejects javascript: URLs and obfuscated javascript: URLs', () => {
    expect(() => validateLink('javascript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('JAVASCRIPT:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('java\x00script:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('java\x09script:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('java\r\nscript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('\x01javascript:alert(1)')).toThrow('Invalid URL format');
  });

  test('rejects data: and vbscript: URLs', () => {
    expect(() => validateLink('data:text/html,<script>alert(1)</script>')).toThrow('Invalid URL format');
    expect(() => validateLink('vbscript:msgbox(1)')).toThrow('Invalid URL format');
  });

  test('rejects relative links without leading slash or protocol', () => {
    expect(() => validateLink('invalid-relative-link')).toThrow('Invalid URL format');
  });
});
