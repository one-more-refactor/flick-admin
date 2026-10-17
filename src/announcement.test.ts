// @ts-ignore
import { expect, test } from 'bun:test';

function validateAndSanitizeUrl(rawLink: unknown): string {
  const link = typeof rawLink === 'string' ? rawLink.trim() : '';
  if (link) {
    const clean = link.replace(/[\x00-\x1F\x7F]/g, '').trim();
    let valid = false;
    if (clean.startsWith('/') && !clean.startsWith('//')) {
      valid = true;
    } else {
      try {
        const parsed = new URL(clean);
        valid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      throw new Error('Invalid URL format. Links must start with http://, https://, or /');
    }
  }
  return link;
}

test('accepts valid HTTP/HTTPS and relative URLs', () => {
  expect(validateAndSanitizeUrl('https://example.com')).toBe('https://example.com');
  expect(validateAndSanitizeUrl('http://example.com/path?a=1')).toBe('http://example.com/path?a=1');
  expect(validateAndSanitizeUrl('/announcement/details')).toBe('/announcement/details');
  expect(validateAndSanitizeUrl('')).toBe('');
});

test('rejects malicious schemes and obfuscated control character URLs', () => {
  expect(() => validateAndSanitizeUrl('javascript:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateAndSanitizeUrl('JAVASCRIPT:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateAndSanitizeUrl('java\x00script:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateAndSanitizeUrl('java\x09script:alert(1)')).toThrow('Invalid URL format');
  expect(() => validateAndSanitizeUrl('data:text/html,<script>alert(1)</script>')).toThrow('Invalid URL format');
  expect(() => validateAndSanitizeUrl('vbscript:msgbox(1)')).toThrow('Invalid URL format');
  expect(() => validateAndSanitizeUrl('//attacker.com')).toThrow('Invalid URL format');
  expect(() => validateAndSanitizeUrl('ftp://example.com')).toThrow('Invalid URL format');
});
