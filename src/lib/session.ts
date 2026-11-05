/** corepanel — session shape checks and small timing guards.
 *
 * Pure functions (no DOM, no Svelte) so they can be unit-tested directly.
 * Ported from the unmerged corepanel hardening PRs (#8, #9, #11, #13 on
 * one-more-refactor/corepanel) after corepanel moved in-tree.
 */

import type { Session } from './types';

/** True when `s` has the shape corepanel relies on: a non-empty token, a
 *  string label and, if present, a finite numeric `expires_at`. Anything that
 *  came out of localStorage or a host's login() is untrusted until this passes
 *  — `{}` must never count as "signed in". */
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

/** Floor for dashboard auto-refresh, in seconds. A misconfigured `refresh: 0.1`
 *  would otherwise hammer the API ten times a second from every open tab. */
export const MIN_REFRESH_SECS = 5;

/** Normalise a dashboard `refresh` value: undefined/0/negative/NaN ⇒ no
 *  polling, anything else is clamped to at least MIN_REFRESH_SECS. */
export function refreshInterval(refresh: number | undefined): number | null {
  if (typeof refresh !== 'number' || !Number.isFinite(refresh) || refresh <= 0) return null;
  return Math.max(MIN_REFRESH_SECS, refresh);
}

/** Latest-request-wins guard. `next()` returns a ticket; `isCurrent(ticket)`
 *  is false once a newer request started, so slow, stale responses (an old
 *  search, a previous page) can't overwrite fresh ones. */
export function latest() {
  let current = 0;
  return {
    next: () => ++current,
    isCurrent: (ticket: number) => ticket === current,
    /** Invalidate everything in flight (e.g. on unmount). */
    cancel: () => {
      current++;
    },
  };
}
