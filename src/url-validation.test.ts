import { test, expect } from 'bun:test';
import { validateLink } from './lib/url';

test('valid URLs pass validation', () => {
  expect(validateLink('https://example.com')).toBe('https://example.com');
  expect(validateLink('http://example.com/path')).toBe('http://example.com/path');
  expect(validateLink('/announcement/details')).toBe('/announcement/details');
});

test('invalid or dangerous URLs fail validation', () => {
  expect(() => validateLink('javascript:alert(1)')).toThrow();
  expect(() => validateLink('java\x00script:alert(1)')).toThrow();
  expect(() => validateLink('java\x01\x09script:alert(1)')).toThrow();
  expect(() => validateLink('data:text/html,<script>alert(1)</script>')).toThrow();
  expect(() => validateLink('vbscript:msgbox(1)')).toThrow();
  expect(() => validateLink('ftp://example.com')).toThrow();
});
