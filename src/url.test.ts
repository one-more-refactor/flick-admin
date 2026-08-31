// @ts-nocheck
import { describe, expect, test } from 'bun:test';
import { validateLink } from './url';

describe('validateLink', () => {
  test('allows valid http, https, and relative URLs', () => {
    expect(() => validateLink('http://example.com')).not.toThrow();
    expect(() => validateLink('https://example.com/path?query=1')).not.toThrow();
    expect(() => validateLink('HTTPS://EXAMPLE.COM')).not.toThrow();
    expect(() => validateLink('/relative/path')).not.toThrow();
    expect(() => validateLink('')).not.toThrow();
  });

  test('blocks javascript: URLs and obfuscated variants', () => {
    expect(() => validateLink('javascript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('java\tscript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('\x00javascript:alert(1)')).toThrow('Invalid URL format');
    expect(() => validateLink('JAVA\x01SCRIPT:alert(1)')).toThrow('Invalid URL format');
  });

  test('blocks data: and vbscript: URLs', () => {
    expect(() => validateLink('data:text/html,<script>alert(1)</script>')).toThrow('Invalid URL format');
    expect(() => validateLink('vbscript:msgbox(1)')).toThrow('Invalid URL format');
  });

  test('blocks protocol-relative URLs (//evil.com)', () => {
    expect(() => validateLink('//evil.com')).toThrow('Invalid URL format');
    expect(() => validateLink('//evil.com/path')).toThrow('Invalid URL format');
  });
});
