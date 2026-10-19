import { expect, test } from 'bun:test';
import { validateAnnouncementUrl } from './main';

test('validates standard http and https URLs', () => {
  expect(validateAnnouncementUrl('https://example.com')).toBe(true);
  expect(validateAnnouncementUrl('http://example.com/path?query=1')).toBe(true);
  expect(validateAnnouncementUrl('/relative/path')).toBe(true);
});

test('rejects XSS protocols like javascript:, data:, and vbscript:', () => {
  expect(validateAnnouncementUrl('javascript:alert(1)')).toBe(false);
  expect(validateAnnouncementUrl('JAVASCRIPT:alert(1)')).toBe(false);
  expect(validateAnnouncementUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  expect(validateAnnouncementUrl('vbscript:msgbox(1)')).toBe(false);
});

test('rejects ASCII control character and null byte bypass attempts', () => {
  expect(validateAnnouncementUrl('java\x00script:alert(1)')).toBe(false);
  expect(validateAnnouncementUrl('java\x09script:alert(1)')).toBe(false);
  expect(validateAnnouncementUrl('\x00javascript:alert(1)')).toBe(false);
});

test('allows valid URLs with leading control characters after stripping', () => {
  expect(validateAnnouncementUrl('\x00https://example.com')).toBe(true);
  expect(validateAnnouncementUrl('\x09/announcement/1')).toBe(true);
});

test('rejects malformed or invalid URLs', () => {
  expect(validateAnnouncementUrl('ftp://example.com')).toBe(false);
  expect(validateAnnouncementUrl('invalid url :::')).toBe(false);
});
