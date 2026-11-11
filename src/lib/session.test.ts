import { describe, expect, test } from 'bun:test';
import { isValidSession, isExpired, parseStoredSession } from './session';

const NOW = 1_700_000_000_000;
const future = NOW / 1000 + 3600;
const past = NOW / 1000 - 60;

describe('isValidSession', () => {
  test('accepts valid session objects', () => {
    expect(isValidSession({ token: 'abc', label: 'admin@flick.local' })).toBe(true);
    expect(isValidSession({ token: 'abc', label: 'admin@flick.local', expires_at: future })).toBe(true);
    expect(isValidSession({ token: 'tok', label: '' })).toBe(true);
    expect(isValidSession({ token: 'tok', label: 'user', expires_at: null })).toBe(true);
  });

  test('rejects non-object or nullish values', () => {
    expect(isValidSession(null)).toBe(false);
    expect(isValidSession(undefined)).toBe(false);
    expect(isValidSession('string')).toBe(false);
    expect(isValidSession(12345)).toBe(false);
    expect(isValidSession([])).toBe(false);
  });

  test('rejects missing or empty token and non-string label', () => {
    expect(isValidSession({})).toBe(false);
    expect(isValidSession({ token: '', label: 'user' })).toBe(false);
    expect(isValidSession({ token: '   ', label: 'user' })).toBe(false);
    expect(isValidSession({ token: 123, label: 'user' })).toBe(false);
    expect(isValidSession({ token: 'tok' })).toBe(false);
    expect(isValidSession({ token: 'tok', label: 123 })).toBe(false);
  });

  test('rejects non-numeric or non-finite expires_at', () => {
    expect(isValidSession({ token: 'tok', label: 'user', expires_at: '9999999' })).toBe(false);
    expect(isValidSession({ token: 'tok', label: 'user', expires_at: Number.NaN })).toBe(false);
    expect(isValidSession({ token: 'tok', label: 'user', expires_at: Infinity })).toBe(false);
  });
});

describe('isExpired', () => {
  test('returns false when expires_at is omitted or null', () => {
    expect(isExpired({ token: 'tok', label: 'user' }, NOW)).toBe(false);
  });

  test('returns false when expires_at is in the future', () => {
    expect(isExpired({ token: 'tok', label: 'user', expires_at: future }, NOW)).toBe(false);
  });

  test('returns true when expires_at is in the past or exactly now', () => {
    expect(isExpired({ token: 'tok', label: 'user', expires_at: past }, NOW)).toBe(true);
    expect(isExpired({ token: 'tok', label: 'user', expires_at: NOW / 1000 }, NOW)).toBe(true);
  });
});

describe('parseStoredSession', () => {
  test('returns parsed Session when valid and not expired', () => {
    const valid = { token: 'tok', label: 'user', expires_at: future };
    expect(parseStoredSession(JSON.stringify(valid), NOW)).toEqual(valid);
  });

  test('returns null for falsy or invalid JSON strings', () => {
    expect(parseStoredSession(null, NOW)).toBeNull();
    expect(parseStoredSession('', NOW)).toBeNull();
    expect(parseStoredSession('invalid-json', NOW)).toBeNull();
  });

  test('returns null for malformed or expired stored sessions', () => {
    expect(parseStoredSession('{}', NOW)).toBeNull();
    expect(parseStoredSession('null', NOW)).toBeNull();
    expect(parseStoredSession('"string"', NOW)).toBeNull();
    expect(parseStoredSession(JSON.stringify({ token: 'tok', label: 'user', expires_at: past }), NOW)).toBeNull();
  });
});
