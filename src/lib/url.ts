export function validateLink(link: string): string {
  if (link) {
    // Strip ASCII control characters and null bytes before URL parsing to prevent XSS
    const sanitized = link.replace(/[\x00-\x1F\x7F]/g, '');
    const clean = sanitized.toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
      throw new Error('Invalid URL format. Links must start with http://, https://, or /');
    }
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      const parsed = new URL(sanitized, base);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      throw new Error('Invalid URL format. Links must start with http://, https://, or /');
    }
    return sanitized;
  }
  return '';
}
