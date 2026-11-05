// Unit tests for the in-tree corepanel session guards (src/lib/session.ts).
// Runs on Node ≥ 22.18 with built-in type stripping: `bun run test`.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidSession,
  isExpired,
  parseStoredSession,
  refreshInterval,
  latest,
  MIN_REFRESH_SECS,
} from '../../src/lib/session.ts';

const NOW = 1_800_000_000_000; // fixed clock, ms
const future = NOW / 1000 + 3600;
const past = NOW / 1000 - 1;

describe('isValidSession', () => {
  test('accepts a well-formed session, with or without expiry', () => {
    assert.equal(isValidSession({ token: 't0k', label: 'root@example.test' }), true);
    assert.equal(isValidSession({ token: 't0k', label: 'x', expires_at: future }), true);
    assert.equal(isValidSession({ token: 't0k', label: '' }), true); // label may be blank
  });

  test('rejects the shapes the corepanel sentinel PRs flagged', () => {
    for (const bad of [
      null,
      undefined,
      {},
      [],
      'token',
      42,
      { token: '', label: 'x' },
      { token: '   ', label: 'x' },
      { token: 123, label: 'x' },
      { token: 't', label: 7 },
      { token: 't' },
      { token: 't', label: 'x', expires_at: '9999999999' },
      { token: 't', label: 'x', expires_at: Number.NaN },
      { token: 't', label: 'x', expires_at: Infinity },
    ]) {
      assert.equal(isValidSession(bad), false, JSON.stringify(bad));
    }
  });
});

describe('isExpired', () => {
  test('only sessions with a past numeric expiry are expired', () => {
    assert.equal(isExpired({ token: 't', label: 'x' }, NOW), false);
    assert.equal(isExpired({ token: 't', label: 'x', expires_at: future }, NOW), false);
    assert.equal(isExpired({ token: 't', label: 'x', expires_at: past }, NOW), true);
    assert.equal(isExpired({ token: 't', label: 'x', expires_at: NOW / 1000 }, NOW), true);
  });
});

describe('parseStoredSession', () => {
  test('round-trips a valid stored session', () => {
    const s = { token: 'abc', label: 'ops@example.test', expires_at: future };
    assert.deepEqual(parseStoredSession(JSON.stringify(s), NOW), s);
  });

  test('returns null for missing, corrupt, malformed and expired payloads', () => {
    assert.equal(parseStoredSession(null, NOW), null);
    assert.equal(parseStoredSession('', NOW), null);
    assert.equal(parseStoredSession('{not json', NOW), null);
    assert.equal(parseStoredSession('{}', NOW), null);
    assert.equal(parseStoredSession('null', NOW), null);
    assert.equal(parseStoredSession('"abc"', NOW), null);
    assert.equal(parseStoredSession(JSON.stringify({ token: 'a', label: 'b', expires_at: past }), NOW), null);
  });
});

describe('refreshInterval', () => {
  test('no polling for unset / zero / negative / NaN', () => {
    for (const v of [undefined, 0, -5, Number.NaN, Infinity]) assert.equal(refreshInterval(v), null);
  });
  test('clamps tiny intervals to the floor and keeps sane ones', () => {
    assert.equal(refreshInterval(0.1), MIN_REFRESH_SECS);
    assert.equal(refreshInterval(1), MIN_REFRESH_SECS);
    assert.equal(refreshInterval(60), 60);
  });
});

describe('latest', () => {
  test('only the newest ticket is current; cancel invalidates all', () => {
    const req = latest();
    const a = req.next();
    const b = req.next();
    assert.equal(req.isCurrent(a), false);
    assert.equal(req.isCurrent(b), true);
    req.cancel();
    assert.equal(req.isCurrent(b), false);
  });
});
