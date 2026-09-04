import { test, expect, describe } from 'bun:test';
import { validateUrl } from './main';

describe('validateUrl', () => {
  test('allows empty or omitted links', () => {
    expect(() => validateUrl('')).not.toThrow();
  });

  test('allows valid http, https, and absolute path URLs', () => {
    expect(() => validateUrl('http://example.com')).not.toThrow();
    expect(() => validateUrl('https://example.com/path?query=1')).not.toThrow();
    expect(() => validateUrl('/dashboard/settings')).not.toThrow();
  });

  test('rejects protocol-relative URLs (//attacker.com)', () => {
    expect(() => validateUrl('//attacker.com')).toThrow(
      'Invalid URL format. Links must start with http://, https://, or /'
    );
  });

  test('rejects javascript: and data: URLs', () => {
    expect(() => validateUrl('javascript:alert(1)')).toThrow();
    expect(() => validateUrl('data:text/html,<b>xss</b>')).toThrow();
    expect(() => validateUrl('vbscript:msgbox(1)')).toThrow();
  });

  test('rejects URLs obfuscated with null bytes and ASCII control characters', () => {
    expect(() => validateUrl('java\x00script:alert(1)')).toThrow();
    expect(() => validateUrl('java\tscript:alert(1)')).toThrow();
    expect(() => validateUrl('javascript\r\n:alert(1)')).toThrow();
  });

  test('rejects non-http/https protocols even if formatted like a URL', () => {
    expect(() => validateUrl('ftp://example.com')).toThrow();
    expect(() => validateUrl('file:///etc/passwd')).toThrow();
  });
});
