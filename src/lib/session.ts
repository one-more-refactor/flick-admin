/** corepanel — session shape checks and parsing guards.
 *
 * Validates session objects from untrusted sources like localStorage or login callbacks
 * before allowing them to access the admin panel shell.
 */

import type { Session } from './types';

/** True when `s` has the shape corepanel relies on: a non-empty token, a
 *  string label and, if present, a finite numeric `expires_at`. Untrusted inputs
 *  (such as `{}` or malformed tokens) must never count as "signed in". */
export function isValidSession(s: unknown): s is Session {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.token === 'string' &&
    o.token.trim() !== '' &&
    typeof o.label === 'string' &&
    (o.expires_at === undefined ||
      o.expires_at === null ||
      (typeof o.expires_at === 'number' && Number.isFinite(o.expires_at)))
  );
}

/** True when the session carries an expiry that has already passed. */
export function isExpired(s: Session, nowMs: number = Date.now()): boolean {
  return typeof s.expires_at === 'number' && s.expires_at * 1000 <= nowMs;
}

/** Parse a persisted session. Returns null for missing, corrupt, malformed or
 *  expired payloads — the caller should then drop the stored value. */
export function parseStoredSession(raw: string | null, nowMs: number = Date.now()): Session | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isValidSession(parsed) || isExpired(parsed, nowMs)) return null;
  return parsed;
}
