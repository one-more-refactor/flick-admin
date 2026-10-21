/**
 * Validates announcement URLs against XSS vulnerabilities and invalid schemes.
 * Strips ASCII control characters and null bytes before validation.
 * Accepts http://, https://, or relative path URLs starting with / (excluding //).
 */
export function isValidAnnouncementUrl(rawUrl: string): boolean {
  if (!rawUrl) return true;
  // Remove ASCII control characters and null bytes (\x00-\x1F, \x7F)
  const cleanUrl = rawUrl.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!cleanUrl) return true;

  try {
    if (cleanUrl.startsWith('/')) {
      // Disallow protocol-relative links (//)
      if (cleanUrl.startsWith('//')) return false;
      const dummyBase = 'http://localhost';
      const parsed = new URL(cleanUrl, dummyBase);
      return parsed.origin === dummyBase;
    }

    const parsed = new URL(cleanUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
