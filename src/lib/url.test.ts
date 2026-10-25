// @ts-ignore - bun test ambient types in runner
import { describe, expect, test } from 'bun:test';
import { validateAnnouncementUrl } from './url';

describe('validateAnnouncementUrl', () => {
  test('returns empty string for null, undefined, or empty values', () => {
    expect(validateAnnouncementUrl(null)).toBe('');
    expect(validateAnnouncementUrl(undefined)).toBe('');
    expect(validateAnnouncementUrl('')).toBe('');
    expect(validateAnnouncementUrl('   ')).toBe('');
  });

  test('allows valid http, https, and relative URLs', () => {
    expect(validateAnnouncementUrl('https://example.com')).toBe('https://example.com');
    expect(validateAnnouncementUrl('http://example.com/page?query=1')).toBe('http://example.com/page?query=1');
    expect(validateAnnouncementUrl('/announcements/new')).toBe('/announcements/new');
  });

  test('rejects unsafe protocols like javascript:, data:, vbscript:', () => {
    expect(() => validateAnnouncementUrl('javascript:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('data:text/html,<script>alert(1)</script>')).toThrow();
    expect(() => validateAnnouncementUrl('vbscript:msgbox(1)')).toThrow();
  });

  test('rejects obfuscated javascript URLs with control characters or null bytes', () => {
    expect(() => validateAnnouncementUrl('java\x00script:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('java\x09script:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('java\x0ascript:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('java\x0dscript:alert(1)')).toThrow();
  });

  test('rejects non-http protocols like ftp: or file:', () => {
    expect(() => validateAnnouncementUrl('ftp://example.com/file')).toThrow();
    expect(() => validateAnnouncementUrl('file:///etc/passwd')).toThrow();
  });
});
