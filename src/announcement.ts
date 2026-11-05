/** Announcement banner — client-side validation that mirrors flick-backend's
 *  `PUT /api/admin/announcement` rules (server/src/admin.rs), so an operator
 *  gets a precise message before the request instead of a generic 400.
 *
 *  The backend stays the authority; this is the friendly first line. */

/** Byte limits enforced by the backend (Rust `str::len()` counts UTF-8 bytes). */
export const LIMITS = { text: 300, link: 300, label: 60 } as const;

export interface AnnouncementBody {
  text: string;
  link: string;
  label: string;
  active: boolean;
}

const utf8Len = (s: string) => new TextEncoder().encode(s).length;

/** Any C0/C1 control character or whitespace inside a URL. Browsers silently
 *  strip tabs/newlines from hrefs ("java\tscript:"), so instead of guessing how
 *  a renderer will normalise them we refuse them outright. */
const UNSAFE_URL_CHARS = /[\u0000-\u0020\u007f-\u009f\s]/u;

/** Validate the banner link. Empty is allowed (no link). Otherwise the value
 *  must be an absolute http(s) URL with a host — the link is rendered as an
 *  `<a href>` for every visitor of the user site, so `javascript:`, `data:`,
 *  `vbscript:`, protocol-relative `//host` and relative paths are all refused
 *  (the backend refuses anything but `http://`/`https://` too).
 *  Returns the trimmed link; throws an Error with an operator-facing message. */
export function validateLink(raw: unknown): string {
  const link = typeof raw === 'string' ? raw.trim() : '';
  if (!link) return '';
  if (utf8Len(link) > LIMITS.link) {
    throw new Error(`link is too long (max ${LIMITS.link} bytes)`);
  }
  if (UNSAFE_URL_CHARS.test(link)) {
    throw new Error('link must not contain spaces or control characters');
  }
  // Prefix check on the raw string (lower-cased) — the backend does exactly
  // this, so "HTTPS://…" is normalised below rather than rejected server-side.
  const lower = link.toLowerCase();
  if (!lower.startsWith('https://') && !lower.startsWith('http://')) {
    throw new Error('link must start with https:// or http://');
  }
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new Error('link is not a valid URL');
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || !url.hostname) {
    throw new Error('link must be an http(s) URL with a host');
  }
  if (url.username || url.password) {
    throw new Error('link must not contain credentials');
  }
  // Lower-case only the scheme so the backend's case-sensitive prefix check
  // accepts it; leave the rest exactly as typed.
  return lower.startsWith('https://') ? 'https://' + link.slice(8) : 'http://' + link.slice(7);
}

/** Build the PUT body from raw form values, or throw with a readable reason. */
export function buildAnnouncement(values: Record<string, unknown>): AnnouncementBody {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const text = str(values.text);
  const label = str(values.label);
  const active = Boolean(values.active);

  if (active && !text.trim()) throw new Error('a published announcement needs a message');
  if (utf8Len(text) > LIMITS.text) throw new Error(`message is too long (max ${LIMITS.text} bytes)`);
  if (utf8Len(label) > LIMITS.label) throw new Error(`link label is too long (max ${LIMITS.label} bytes)`);

  return { text, link: validateLink(values.link), label, active };
}
