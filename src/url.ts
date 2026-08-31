export function validateLink(link: string): void {
  if (!link) return;
  // Validate the URL protocol using standard URL parser to prevent XSS (e.g., javascript:, data:, vbscript:)
  // Strip ASCII control chars and null bytes first to prevent evasion (e.g., java\tscript:)
  const sanitized = link.replace(/[\x00-\x1F\x7F]/g, '');
  if (sanitized.startsWith('//')) {
    throw new Error('Invalid URL format. Links must start with http://, https://, or /');
  }
  try {
    const url = new URL(sanitized, 'http://localhost');
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const isRelative = sanitized.startsWith('/') && !sanitized.startsWith('//');
    const lower = sanitized.toLowerCase();
    const hasValidScheme = lower.startsWith('http://') || lower.startsWith('https://');
    if (!isHttp || (!hasValidScheme && !isRelative)) {
      throw new Error('Invalid URL protocol');
    }
  } catch {
    throw new Error('Invalid URL format. Links must start with http://, https://, or /');
  }
}
