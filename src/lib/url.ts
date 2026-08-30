/**
 * Validates a URL link to prevent XSS attacks (e.g., javascript:, data:, vbscript:) and open redirects (//evil.com).
 * Strips ASCII control characters and null bytes prior to validation.
 */
export function validateUrl(link: string): void {
  const sanitized = link.replace(/[\x00-\x1F\x7F]/g, '');
  let parsed: URL;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://dummy.local';
    parsed = new URL(sanitized, base);
  } catch {
    throw new Error('Invalid URL format. Links must start with http://, https://, or /');
  }
  if (sanitized.startsWith('//') || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
    throw new Error('Invalid URL format. Links must start with http://, https://, or /');
  }
}
