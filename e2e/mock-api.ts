/**
 * In-browser fake of flick-backend's admin API (`/api/admin/*`, see
 * flick CONTRACTS.md › Admin API), installed with Playwright's page.route().
 *
 * The e2e suite and the media capture both use it, so neither needs a running
 * backend or a database. All data is invented demo data — `example.test`
 * addresses, public-domain books — never real users.
 */
import type { Page, Route } from '@playwright/test';

export const ADMIN = { email: 'ops@example.test', password: 'correct horse battery staple' };
export const ENV_TOKEN = 'demo-env-token';

/** Fixed "now" so screenshots don't drift between runs. */
export const NOW = Date.parse('2026-11-06T09:30:00Z');
const DAY = 86_400;
const nowS = Math.floor(NOW / 1000);

export interface MockUser {
  id: string;
  email: string | null;
  name: string;
  is_admin: boolean;
  guest: boolean;
  plan: 'free' | 'pro';
  pro_days: number;
  words: number;
  last_day: string | null;
  created_at: number;
}

export interface MockOptions {
  /** Seconds until a password-login session expires (backend: 12 h). */
  sessionTtl?: number;
  /** Artificial latency per request, ms (useful to see busy states). */
  latency?: number;
}

export interface MockState {
  users: MockUser[];
  events: Array<{ id: string; kind: string; title: string; starts_at: number; ends_at: number }>;
  announcement: { text: string; link: string; label: string; active: boolean; updated_at: number };
  sessions: Set<string>;
  /** Every request the panel made, for assertions: "PUT /api/admin/announcement". */
  log: string[];
  /** Last JSON body per "METHOD path". */
  bodies: Map<string, unknown>;
}

const FIRST = ['ada', 'grace', 'alan', 'edsger', 'barbara', 'ken', 'margaret', 'linus', 'radia', 'donald', 'frances', 'john'];
const LAST = ['lovelace', 'hopper', 'turing', 'dijkstra', 'liskov', 'thompson', 'hamilton', 'torvalds', 'perlman', 'knuth', 'allen', 'backus'];

/** Deterministic pseudo-random so every run renders identical charts. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

const iso = (s: number) => new Date(s * 1000).toISOString().slice(0, 10);

export function seed(): MockState {
  const r = rng(42);
  const users: MockUser[] = [
    { id: 'u-ops-0001', email: ADMIN.email, name: 'Ops', is_admin: true, guest: false, plan: 'pro', pro_days: 0, words: 912_400, last_day: iso(nowS), created_at: nowS - 300 * DAY },
  ];
  for (let i = 0; i < 64; i++) {
    const guest = i % 5 === 4;
    const first = FIRST[i % FIRST.length];
    const last = LAST[i % LAST.length];
    users.push({
      id: `u-${(0x1a2b3c + i * 7919).toString(16)}`,
      email: guest ? null : `${first}.${last}${i}@example.test`,
      name: guest ? '' : `${first[0].toUpperCase()}${first.slice(1)} ${last[0].toUpperCase()}${last.slice(1)}`,
      is_admin: i === 3,
      guest,
      plan: i % 3 === 0 ? 'pro' : 'free',
      pro_days: i % 7 === 0 ? 14 : 0,
      words: Math.round(r() * 400_000),
      last_day: r() > 0.2 ? iso(nowS - Math.floor(r() * 20) * DAY) : null,
      created_at: nowS - Math.floor(r() * 200 + 1) * DAY,
    });
  }
  return {
    users,
    events: [
      { id: 'ev-1', kind: 'referral', title: 'Bring a friend — 30 days pro each', starts_at: nowS - 5 * DAY, ends_at: nowS + 25 * DAY },
      { id: 'ev-2', kind: 'free_pro', title: 'Exam season: pro for everyone', starts_at: nowS - DAY, ends_at: nowS + 6 * DAY },
      { id: 'ev-3', kind: 'promo', title: 'Launch week code FLICK15', starts_at: nowS + 2 * DAY, ends_at: nowS + 9 * DAY },
    ],
    announcement: {
      text: 'flick 1.5 is out — chapters, a calmer reader and faster EPUB import.',
      link: 'https://myflick.app/changelog',
      label: "what's new",
      active: true,
      updated_at: nowS - 3 * DAY,
    },
    sessions: new Set([ENV_TOKEN]),
    log: [],
    bodies: new Map(),
  };
}

function overview(st: MockState) {
  const r = rng(7);
  const series = (base: number, swing: number) =>
    Array.from({ length: 30 }, (_, i) => ({
      day: iso(nowS - (29 - i) * DAY),
      value: Math.round(base + swing * Math.sin(i / 3) + r() * swing + i * base * 0.02),
    }));
  const registered = st.users.filter((u) => !u.guest).length;
  return {
    totals: {
      users: 18_342,
      registered: 11_907 + registered,
      guests: 6_435 - registered,
      words: 1_284_550_000,
      sessions: 402_118,
      books: 23_871,
      admins: st.users.filter((u) => u.is_admin).length,
    },
    active: { d1: 1_204, d7: 4_870, d30: 9_312 },
    series: { words: series(3_900_000, 900_000), readers: series(1_150, 220), signups: series(48, 18) },
    wpm_histogram: [200, 250, 300, 350, 400, 450, 500, 600, 700, 800].map((wpm, i) => ({
      wpm,
      sessions: Math.round(9_000 * Math.exp(-((i - 3.2) ** 2) / 5)),
    })),
    top_books: [
      { title: 'Moby-Dick', author: 'Herman Melville', readers: 812, words: 92_400_000 },
      { title: 'Pride and Prejudice', author: 'Jane Austen', readers: 774, words: 71_300_000 },
      { title: 'Frankenstein', author: 'Mary Shelley', readers: 651, words: 44_800_000 },
      { title: 'The Odyssey', author: 'Homer', readers: 498, words: 39_100_000 },
      { title: 'Meditations', author: 'Marcus Aurelius', readers: 455, words: 12_700_000 },
    ],
    db_size_bytes: 412 * 1048576,
    version: '1.5.0',
    edition: 'hosted',
    uptime_secs: 3 * DAY + 7 * 3600 + 12 * 60,
  };
}

/**
 * Route every `/api/admin/*` request of `page` to an in-memory backend.
 * Returns the live state so tests can assert on it or mutate it.
 */
export async function mockApi(page: Page, opts: MockOptions = {}): Promise<MockState> {
  const st = seed();
  const ttl = opts.sessionTtl ?? 12 * 3600;

  const json = (route: Route, status: number, body?: unknown) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: body === undefined ? '' : JSON.stringify(body),
    });

  await page.route('**/api/admin/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    st.log.push(`${method} ${path}`);
    let body: any;
    try {
      body = req.postDataJSON();
    } catch {
      body = undefined;
    }
    if (body !== undefined && body !== null) st.bodies.set(`${method} ${path}`, body);
    if (opts.latency) await new Promise((r) => setTimeout(r, opts.latency));

    // -- unauthenticated
    if (method === 'POST' && path === '/api/admin/login') {
      if (body?.email === ADMIN.email && body?.password === ADMIN.password) {
        const token = `sess-${st.sessions.size}-${Math.random().toString(36).slice(2)}`;
        st.sessions.add(token);
        return json(route, 200, {
          token,
          expires_at: Math.floor(Date.now() / 1000) + ttl,
          email: ADMIN.email,
          name: 'Ops',
        });
      }
      return json(route, 401, { error: 'unauthorized' });
    }

    // -- everything else needs a live bearer
    const token = (req.headers()['authorization'] ?? '').replace(/^Bearer /, '');
    if (!st.sessions.has(token)) return json(route, 401, { error: 'unauthorized' });

    if (method === 'GET' && path === '/api/admin/me') {
      return json(route, 200, token === ENV_TOKEN ? { via: 'token' } : { via: 'session', email: ADMIN.email, name: 'Ops' });
    }
    if (method === 'DELETE' && path === '/api/admin/session') {
      st.sessions.delete(token);
      return json(route, 204);
    }
    if (method === 'GET' && path === '/api/admin/overview') return json(route, 200, overview(st));

    if (method === 'GET' && path === '/api/admin/users') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const limit = Number(url.searchParams.get('limit') ?? 50);
      const offset = Number(url.searchParams.get('offset') ?? 0);
      const hits = st.users.filter((u) => !q || (u.email ?? '').includes(q) || u.name.toLowerCase().includes(q));
      return json(route, 200, { total: hits.length, users: hits.slice(offset, offset + limit) });
    }
    const userMatch = path.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (userMatch) {
      const id = decodeURIComponent(userMatch[1]);
      const u = st.users.find((x) => x.id === id);
      if (!u) return json(route, 404, { error: 'not found' });
      if (method === 'PATCH') {
        if (typeof body?.is_admin === 'boolean') u.is_admin = body.is_admin;
        return json(route, 200, u);
      }
      if (method === 'DELETE') {
        st.users = st.users.filter((x) => x.id !== id);
        return json(route, 204);
      }
    }

    if (method === 'GET' && path === '/api/admin/events') return json(route, 200, st.events);
    const evMatch = path.match(/^\/api\/admin\/events\/([^/]+)$/);
    if (evMatch && method === 'DELETE') {
      const id = decodeURIComponent(evMatch[1]);
      st.events = st.events.filter((e) => e.id !== id);
      return json(route, 204);
    }

    if (path === '/api/admin/announcement') {
      if (method === 'GET') return json(route, 200, st.announcement);
      if (method === 'PUT') {
        // Same rules as flick-backend admin.rs::announcement_put.
        const enc = (s: string) => new TextEncoder().encode(s).length;
        if (body.active && !String(body.text).trim()) return json(route, 400, { error: 'an active announcement needs text' });
        if (enc(body.text) > 300 || enc(body.link) > 300 || enc(body.label) > 60) return json(route, 400, { error: 'announcement too long' });
        if (body.link && !body.link.startsWith('https://') && !body.link.startsWith('http://')) {
          return json(route, 400, { error: 'link must be http(s)' });
        }
        st.announcement = { ...body, updated_at: Math.floor(Date.now() / 1000) };
        return json(route, 200, st.announcement);
      }
    }

    return json(route, 404, { error: `mock: no route for ${method} ${path}` });
  });

  return st;
}

/** The localStorage key Panel.svelte uses for config.title "flick admin". */
export const STORE_KEY = 'cp.session.flick-admin';
