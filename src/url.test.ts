import { describe, expect, test } from 'bun:test';

function validateUrl(link: string): boolean {
  if (!link) return true;
  const clean = link.replace(/[\x00-\x1F\x7F]/g, '');
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(clean, origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

describe('URL validation for announcement links', () => {
  test('allows valid absolute http/https URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://example.com/page?query=1#hash')).toBe(true);
  });

  test('allows relative URLs', () => {
    expect(validateUrl('/blog/announcement')).toBe(true);
    expect(validateUrl('/path/to/resource?id=123')).toBe(true);
  });

  test('rejects javascript: and obfuscated javascript: URLs', () => {
    expect(validateUrl('javascript:alert(1)')).toBe(false);
    expect(validateUrl('java\x01script:alert(1)')).toBe(false);
    expect(validateUrl('java\x00script:alert(1)')).toBe(false);
    expect(validateUrl('java\nscript:alert(1)')).toBe(false);
    expect(validateUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });

  test('rejects data: and vbscript: URLs', () => {
    expect(validateUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(validateUrl('vbscript:msgbox(1)')).toBe(false);
  });

  test('rejects other non-http schemes', () => {
    expect(validateUrl('ftp://example.com/file')).toBe(false);
    expect(validateUrl('file:///etc/passwd')).toBe(false);
  });
});
