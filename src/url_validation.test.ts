import { expect, test } from 'bun:test';
import { validateUrl } from './utils';

test('valid URLs pass validation', () => {
  expect(validateUrl('https://example.com')).toBe('https://example.com');
  expect(validateUrl('http://example.com/path')).toBe('http://example.com/path');
  expect(validateUrl('/relative/path')).toBe('/relative/path');
  expect(validateUrl('')).toBe('');
  expect(validateUrl(null)).toBe('');
});

test('XSS and non-HTTP protocols fail validation', () => {
  expect(() => validateUrl('javascript:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('java\x00script:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('java\x09script:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('data:text/html,<script>alert(1)</script>')).toThrow('Invalid URL format');
  expect(() => validateUrl('vbscript:msgbox(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('file:///etc/passwd')).toThrow('Invalid URL format');
});
