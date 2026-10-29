import { describe, expect, test } from 'bun:test';
import { validateUrl } from './main';

describe('validateUrl', () => {
  test('allows valid HTTP, HTTPS, and relative URLs', () => {
    expect(() => validateUrl('http://example.com')).not.toThrow();
    expect(() => validateUrl('https://example.com/path?query=1')).not.toThrow();
    expect(() => validateUrl('/dashboard/settings')).not.toThrow();
  });

  test('rejects javascript: and other dangerous protocols', () => {
    expect(() => validateUrl('javascript:alert(1)')).toThrow();
    expect(() => validateUrl('data:text/html,<script>alert(1)</script>')).toThrow();
    expect(() => validateUrl('vbscript:msgbox(1)')).toThrow();
  });

  test('rejects URLs containing hidden control characters or null bytes', () => {
    expect(() => validateUrl('java\x00script:alert(1)')).toThrow();
    expect(() => validateUrl('java\x01script:alert(1)')).toThrow();
  });

  test('rejects protocol-relative URLs and plain strings without leading slash', () => {
    expect(() => validateUrl('//evil.com/xss')).toThrow();
    expect(() => validateUrl('not-a-valid-url')).toThrow();
  });
});
