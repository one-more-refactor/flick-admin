/** Thin fetch wrappers for the flick admin API (CONTRACTS.md "Admin API").
 *  Bearer-only: the panel never touches flick's cookie sessions. */

import type { Session } from 'corepanel';

/** Same-origin by default (nginx proxies /api in prod, Vite in dev). */
const BASE = import.meta.env.VITE_FLICK_API ?? '';

async function req(
  method: string,
  path: string,
  session: Session | null,
  body?: unknown
): Promise<any> {
  const headers: Record<string, string> = {};
  if (session) headers.authorization = `Bearer ${session.token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const resp = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!resp.ok) {
    let msg = `${resp.status}`;
    try {
      msg = (await resp.json()).error ?? msg;
    } catch {
      // non-JSON error body — the status code is the message
    }
    throw new Error(msg);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

export const get = (path: string, s: Session) => req('GET', path, s);
export const post = (path: string, s: Session | null, body?: unknown) =>
  req('POST', path, s, body);
export const put = (path: string, s: Session, body: unknown) => req('PUT', path, s, body);
export const patch = (path: string, s: Session, body: unknown) => req('PATCH', path, s, body);
export const del = (path: string, s: Session) => req('DELETE', path, s);
