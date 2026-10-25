/**
 * Validates and normalizes an announcement URL to prevent XSS attacks
 * (e.g., javascript:, data:, vbscript:) including control character obfuscation.
 */
export function validateAnnouncementUrl(rawLink: unknown): string {
  const link = typeof rawLink === 'string' ? rawLink.trim() : '';
  if (!link) return '';

  // Strip ASCII control characters and null bytes (\x00-\x1F, \x7F)
  const sanitized = link.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!sanitized) return '';

  try {
    const parsed = new URL(sanitized, 'http://localhost');
    const protocol = parsed.protocol.toLowerCase();

    if (sanitized.startsWith('/')) {
      return sanitized;
    }
    if (protocol === 'http:' || protocol === 'https:') {
      return sanitized;
    }
  } catch {
    // Invalid URL structure
  }

  throw new Error('Invalid URL format. Links must start with http://, https://, or /');
}
