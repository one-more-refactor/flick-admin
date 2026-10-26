import { describe, expect, test } from 'bun:test';
import { validateUrl } from './main';

describe('validateUrl', () => {
  test('allows valid http, https, and relative URLs', () => {
    expect(validateUrl('http://example.com')).toBe('http://example.com');
    expect(validateUrl('https://example.com/path?a=1')).toBe('https://example.com/path?a=1');
    expect(validateUrl('/about')).toBe('/about');
  });

  test('strips ASCII control characters and null bytes', () => {
    expect(validateUrl('\x00https://example.com')).toBe('https://example.com');
    expect(validateUrl('https://example.com/\x07test')).toBe('https://example.com/test');
  });

  test('rejects javascript:, data:, and vbscript: protocols', () => {
    expect(() => validateUrl('javascript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateUrl('data:text/html,xss')).toThrow('Invalid URL format');
    expect(() => validateUrl('vbscript:msgbox(1)')).toThrow('Invalid URL format');
  });

  test('rejects obfuscated/control character javascript: payloads', () => {
    expect(() => validateUrl('java\x00script:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateUrl('java\tscript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateUrl('\x00javascript:alert(1)')).toThrow('Invalid URL format');
  });

  test('rejects invalid schemes or non-matching URLs', () => {
    expect(() => validateUrl('ftp://example.com')).toThrow('Invalid URL format');
    expect(() => validateUrl('example.com')).toThrow('Invalid URL format');
  });
});
