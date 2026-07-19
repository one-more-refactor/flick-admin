import { mount } from 'svelte';
import { Panel, type PanelConfig, type Session } from 'corepanel';
import 'corepanel/theme.css';
import { get, post, put, patch, del } from './api';

const day = (v: { day: string; value: number }) => ({ x: v.day.slice(5), y: v.value });
const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 10_000 ? (n / 1000).toFixed(1) + 'k' : String(n);
const uptime = (s: number) =>
  s >= 86_400 ? `${Math.floor(s / 86_400)}d ${Math.floor((s % 86_400) / 3600)}h` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

const config: PanelConfig = {
  title: 'flick admin',
  footer: 'flick-admin · corepanel',
  auth: {
    async login(email, password): Promise<Session> {
      const r = await post('/api/admin/login', null, { email, password });
      return { token: r.token, label: r.email ?? r.name, expires_at: r.expires_at };
    },
    async tokenLogin(token): Promise<Session> {
      const me = await get('/api/admin/me', { token, label: '' });
      return { token, label: me.email ?? 'env token' };
    },
    async check(session) {
      try {
        await get('/api/admin/me', session);
        return true;
      } catch {
        return false;
      }
    },
    async logout(session) {
      await del('/api/admin/session', session);
    },
  },
  pages: [
    {
      kind: 'dashboard',
      id: 'overview',
      label: 'overview',
      refresh: 60,
      load: (s) => get('/api/admin/overview', s),
      widgets: [
        { type: 'stat', label: 'users', value: (d: any) => fmt(d.totals.users), hint: (d: any) => `${d.totals.registered} registered · ${d.totals.guests} guests` },
        { type: 'stat', label: 'active / 7d', value: (d: any) => fmt(d.active.d7), hint: (d: any) => `${d.active.d1} today · ${d.active.d30} / 30d` },
        { type: 'stat', label: 'words read', value: (d: any) => fmt(d.totals.words), hint: (d: any) => `${fmt(d.totals.sessions)} sessions` },
        { type: 'stat', label: 'books', value: (d: any) => fmt(d.totals.books), hint: (d: any) => `db ${(d.db_size_bytes / 1048576).toFixed(1)} MB` },
        { type: 'line', label: 'words / day — 30d', span: 2, series: (d: any) => d.series.words.map(day) },
        { type: 'line', label: 'readers / day — 30d', span: 2, series: (d: any) => d.series.readers.map(day) },
        { type: 'line', label: 'signups / day — 30d', span: 2, series: (d: any) => d.series.signups.map(day) },
        { type: 'bar', label: 'wpm distribution', span: 2, bars: (d: any) => d.wpm_histogram.map((b: any) => ({ label: String(b.wpm), value: b.sessions })) },
        { type: 'list', label: 'top books', span: 2, header: ['title', 'author', 'readers', 'words'], rows: (d: any) => d.top_books.map((b: any) => [b.title, b.author, String(b.readers), fmt(b.words)]) },
        { type: 'stat', label: 'server', value: (d: any) => `v${d.version}`, hint: (d: any) => `${d.edition} · up ${uptime(d.uptime_secs)} · ${d.totals.admins} admins` },
      ],
    },
    {
      kind: 'resource',
      id: 'users',
      label: 'users',
      resource: {
        load: async (s, q) => {
          const r = await get(`/api/admin/users?q=${encodeURIComponent(q.q)}&limit=${q.limit}&offset=${q.offset}`, s);
          return { total: r.total, rows: r.users };
        },
        columns: [
          { key: 'email', label: 'email', render: (r) => r.email ?? `(guest ${r.id.slice(0, 6)})` },
          { key: 'name', label: 'name' },
          { key: 'is_admin', label: 'role', render: (r) => (r.is_admin ? 'admin' : r.guest ? 'guest' : 'user'), badge: (r) => (r.is_admin ? 'on' : r.guest ? 'off' : null) },
          { key: 'plan', label: 'plan', render: (r) => (r.pro_days > 0 ? `${r.plan} +${r.pro_days}d` : r.plan) },
          { key: 'words', label: 'words', num: true, render: (r) => fmt(r.words) },
          { key: 'last_day', label: 'last read', render: (r) => r.last_day ?? '—' },
          { key: 'created_at', label: 'joined', render: (r) => new Date(r.created_at * 1000).toISOString().slice(0, 10) },
        ],
        actions: [
          { label: 'make admin', when: (r) => !r.is_admin && !r.guest && r.email, run: (s, r) => patch(`/api/admin/users/${r.id}`, s, { is_admin: true }) },
          { label: 'revoke admin', danger: true, when: (r) => r.is_admin, run: (s, r) => patch(`/api/admin/users/${r.id}`, s, { is_admin: false }) },
          { label: 'delete', danger: true, run: (s, r) => del(`/api/admin/users/${r.id}`, s) },
        ],
      },
    },
    {
      kind: 'resource',
      id: 'events',
      label: 'events',
      resource: {
        searchable: false,
        load: async (s) => {
          const rows = await get('/api/admin/events', s);
          return { total: rows.length, rows };
        },
        columns: [
          { key: 'kind', label: 'kind', badge: () => 'on' },
          { key: 'title', label: 'title' },
          { key: 'starts_at', label: 'starts', render: (r) => new Date(r.starts_at * 1000).toISOString().slice(0, 16).replace('T', ' ') },
          { key: 'ends_at', label: 'ends', render: (r) => new Date(r.ends_at * 1000).toISOString().slice(0, 16).replace('T', ' ') },
        ],
        actions: [{ label: 'end event', danger: true, run: (s, r) => del(`/api/admin/events/${r.id}`, s) }],
      },
    },
    {
      kind: 'form',
      id: 'announcement',
      label: 'announcement',
      form: {
        description:
          'Shown as a banner on the user site while published. Dismissals are per content — editing the text brings it back for everyone.',
        load: (s) => get('/api/admin/announcement', s),
        fields: [
          { key: 'text', label: 'message', type: 'textarea', placeholder: 'what changed?' },
          { key: 'link', label: 'link (optional)', type: 'text', placeholder: 'https://…' },
          { key: 'label', label: 'link label', type: 'text', placeholder: 'read more' },
          { key: 'active', label: 'published', type: 'toggle' },
        ],
        save: (s, v) =>
          put('/api/admin/announcement', s, {
            text: v.text ?? '',
            link: v.link ?? '',
            label: v.label ?? '',
            active: Boolean(v.active),
          }),
      },
    },
  ],
};

mount(Panel, { target: document.getElementById('app')!, props: { config } });
