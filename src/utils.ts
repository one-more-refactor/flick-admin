export function validateUrl(rawLink: unknown): string {
  let link = typeof rawLink === 'string' ? rawLink.replace(/[\x00-\x1F\x7F]/g, '').trim() : '';
  if (link) {
    // Validate the URL protocol using WHATWG URL constructor to prevent XSS attacks
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      const parsed = new URL(link, origin);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      throw new Error('Invalid URL format. Links must start with http://, https://, or /');
    }
  }
  return link;
}
