import { describe, expect, test } from 'bun:test';
import { isValidAnnouncementUrl } from './url';

describe('isValidAnnouncementUrl', () => {
  test('allows empty or whitespace-only links', () => {
    expect(isValidAnnouncementUrl('')).toBe(true);
    expect(isValidAnnouncementUrl('   ')).toBe(true);
  });

  test('allows valid http and https URLs', () => {
    expect(isValidAnnouncementUrl('http://example.com')).toBe(true);
    expect(isValidAnnouncementUrl('https://example.com/page?query=1#hash')).toBe(true);
  });

  test('allows valid relative URLs starting with /', () => {
    expect(isValidAnnouncementUrl('/about')).toBe(true);
    expect(isValidAnnouncementUrl('/blog/post-1?id=123')).toBe(true);
  });

  test('rejects protocol-relative URLs', () => {
    expect(isValidAnnouncementUrl('//evil.com')).toBe(false);
  });

  test('rejects dangerous schemes', () => {
    expect(isValidAnnouncementUrl('javascript:alert(1)')).toBe(false);
    expect(isValidAnnouncementUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidAnnouncementUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isValidAnnouncementUrl('file:///etc/passwd')).toBe(false);
  });

  test('rejects obfuscated links with control characters or null bytes', () => {
    expect(isValidAnnouncementUrl('java\x00script:alert(1)')).toBe(false);
    expect(isValidAnnouncementUrl('java\x01script:alert(1)')).toBe(false);
    expect(isValidAnnouncementUrl('javascript\x7F:alert(1)')).toBe(false);
  });

  test('rejects invalid or relative paths without leading slash', () => {
    expect(isValidAnnouncementUrl('example.com')).toBe(false);
    expect(isValidAnnouncementUrl('ftp://example.com')).toBe(false);
  });
});
