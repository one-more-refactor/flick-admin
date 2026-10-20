/**
 * Validates and sanitizes a URL link for announcements.
 * Strips control characters and null bytes before parsing to prevent XSS via javascript: or data: URLs.
 */
export function validateAndSanitizeLink(rawLink: string): string {
  const trimmed = rawLink.trim();
  if (!trimmed) return '';

  // Strip ASCII control characters (0x00-0x1F, 0x7F) and null bytes
  const sanitized = trimmed.replace(/[\x00-\x1F\x7F]/g, '');
  if (!sanitized) return '';

  if (sanitized.startsWith('/')) {
    return sanitized;
  }

  try {
    const parsed = new URL(sanitized);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return sanitized;
    }
  } catch {
    // URL constructor failed (e.g. invalid URL or relative URL without leading /)
  }

  throw new Error('Invalid URL format. Links must start with http://, https://, or /');
}
