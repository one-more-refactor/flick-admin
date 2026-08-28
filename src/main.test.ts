import { describe, expect, it } from 'bun:test';

function validateAnnouncementLink(link: string): void {
  const cleanLink = typeof link === 'string' ? link.trim() : '';
  if (cleanLink) {
    try {
      const clean = cleanLink.replace(/[\x00-\x1F\x7F]/g, '');
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';
      const parsed = new URL(clean, origin);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid URL protocol');
      }
    } catch {
      throw new Error('Invalid URL format. Links must start with http://, https://, or /');
    }
  }
}

describe('Announcement Link Validation', () => {
  it('allows valid http and https URLs', () => {
    expect(() => validateAnnouncementLink('https://example.com')).not.toThrow();
    expect(() => validateAnnouncementLink('http://example.com/path')).not.toThrow();
  });

  it('allows relative path URLs', () => {
    expect(() => validateAnnouncementLink('/dashboard')).not.toThrow();
    expect(() => validateAnnouncementLink('/about?query=1')).not.toThrow();
  });

  it('rejects javascript: and data: URIs', () => {
    expect(() => validateAnnouncementLink('javascript:alert(1)')).toThrow();
    expect(() => validateAnnouncementLink('JAVASCRIPT:alert(1)')).toThrow();
    expect(() => validateAnnouncementLink('java\0script:alert(1)')).toThrow();
    expect(() => validateAnnouncementLink('data:text/html,<script>alert(1)</script>')).toThrow();
    expect(() => validateAnnouncementLink('vbscript:msgbox(1)')).toThrow();
  });

  it('rejects invalid or unsupported protocols', () => {
    expect(() => validateAnnouncementLink('ftp://example.com')).toThrow();
    expect(() => validateAnnouncementLink('file:///etc/passwd')).toThrow();
  });
});
