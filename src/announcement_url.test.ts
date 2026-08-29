import { describe, test, expect } from 'bun:test';
import { validateAnnouncementUrl } from './main';

describe('validateAnnouncementUrl', () => {
  test('allows empty or valid URLs', () => {
    expect(() => validateAnnouncementUrl('')).not.toThrow();
    expect(() => validateAnnouncementUrl('https://example.com')).not.toThrow();
    expect(() => validateAnnouncementUrl('http://example.com/path')).not.toThrow();
    expect(() => validateAnnouncementUrl('/relative/path')).not.toThrow();
  });

  test('blocks javascript: and obfuscated javascript: URLs', () => {
    expect(() => validateAnnouncementUrl('javascript:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('JAVASCRIPT:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('java\tscript:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('java\nscript:alert(1)')).toThrow();
    expect(() => validateAnnouncementUrl('java\x00script:alert(1)')).toThrow();
  });

  test('blocks other dangerous protocols', () => {
    expect(() => validateAnnouncementUrl('data:text/html,<script>alert(1)</script>')).toThrow();
    expect(() => validateAnnouncementUrl('vbscript:msgbox(1)')).toThrow();
    expect(() => validateAnnouncementUrl('file:///etc/passwd')).toThrow();
  });

  test('blocks non-matching relative or protocol-relative schemes', () => {
    expect(() => validateAnnouncementUrl('ftp://example.com')).toThrow();
    expect(() => validateAnnouncementUrl('//attacker.com')).toThrow();
  });
});
