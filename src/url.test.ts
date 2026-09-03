declare const test: (name: string, fn: () => void) => void;
declare const expect: (val: any) => any;

import { validateUrl } from './main';

test('validateUrl allows valid http and https URLs', () => {
  expect(validateUrl('https://example.com')).toBe('https://example.com');
  expect(validateUrl('http://example.com/path?q=1#hash')).toBe('http://example.com/path?q=1#hash');
  expect(validateUrl('  https://domain.org/  ')).toBe('https://domain.org/');
});

test('validateUrl allows relative paths starting with /', () => {
  expect(validateUrl('/announcement/123')).toBe('/announcement/123');
  expect(validateUrl('/about')).toBe('/about');
});

test('validateUrl returns empty string for empty inputs', () => {
  expect(validateUrl('')).toBe('');
  expect(validateUrl('   ')).toBe('');
});

test('validateUrl strips control characters and null bytes from valid URLs', () => {
  expect(validateUrl('https://example.com/\x00path')).toBe('https://example.com/path');
});

test('validateUrl rejects relative paths not starting with /', () => {
  expect(() => validateUrl('announcement/123')).toThrow('Invalid URL format');
  expect(() => validateUrl('example.com')).toThrow('Invalid URL format');
});

test('validateUrl rejects javascript: and other dangerous protocols', () => {
  expect(() => validateUrl('javascript:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('JAVASCRIPT:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('data:text/html,<script>alert(1)</script>')).toThrow('Invalid URL format');
  expect(() => validateUrl('vbscript:msgbox(1)')).toThrow('Invalid URL format');
});

test('validateUrl rejects control character obfuscated URLs', () => {
  expect(() => validateUrl('java\x00script:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('java\x09script:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('java\x0D\x0Ascript:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateUrl('\x01javascript:alert(1)')).toThrow('Invalid URL format');
});

test('validateUrl rejects malformed URLs', () => {
  expect(() => validateUrl('http://:')).toThrow('Invalid URL format');
  expect(() => validateUrl('xyz://something')).toThrow('Invalid URL format');
});
