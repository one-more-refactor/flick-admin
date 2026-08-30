// @ts-ignore
import { test, expect } from 'bun:test';
import { validateUrl } from './lib/url';

test('accepts valid http and https URLs', () => {
  expect(() => validateUrl('http://example.com')).not.toThrow();
  expect(() => validateUrl('https://example.com/path?q=1')).not.toThrow();
});

test('accepts valid relative path URLs', () => {
  expect(() => validateUrl('/announcements/new')).not.toThrow();
});

test('rejects protocol-relative URLs', () => {
  expect(() => validateUrl('//evil.com')).toThrow('Invalid URL format');
  expect(() => validateUrl('//attacker.com/malicious')).toThrow('Invalid URL format');
});

test('rejects javascript: URLs including control character bypass attempts', () => {
  expect(() => validateUrl('javascript:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('java\x00script:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('java\x09script:alert(1)')).toThrow('Invalid URL format');
});

test('rejects data:, vbscript: and other non-http(s) schemes', () => {
  expect(() => validateUrl('data:text/html,<script>alert(1)</script>')).toThrow('Invalid URL format');
  expect(() => validateUrl('vbscript:msgbox(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('file:///etc/passwd')).toThrow('Invalid URL format');
});
