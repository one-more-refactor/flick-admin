# corepanel_

[![ci](https://github.com/one-more-refactor/corepanel/actions/workflows/ci.yml/badge.svg)](https://github.com/one-more-refactor/corepanel/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/one-more-refactor/corepanel?labelColor=111111&color=d32f2f)](https://github.com/one-more-refactor/corepanel/releases/latest)
[![license](https://img.shields.io/badge/license-MIT-d32f2f?labelColor=111111)](LICENSE)

A small, strict admin-panel toolkit for **Svelte 5**. Providers in, panel out — no backend of its own, no router, no CSS framework. One accent, monospace, square corners.

Born as the base of [flick-admin](https://github.com/one-more-refactor/flick-admin); generic on purpose so the next service gets its panel for free — **depend on it, don't fork it**.

## The idea

You describe your admin surface as data; corepanel renders everything else (login, shell, nav, dashboards, tables, forms):

```ts
import { Panel, type PanelConfig } from 'corepanel';
import 'corepanel/theme.css';
import { mount } from 'svelte';

const config: PanelConfig = {
  title: 'myapp admin',
  auth: {
    async login(email, password) {           // → your API
      const r = await post('/api/admin/login', { email, password });
      return { token: r.token, label: r.email, expires_at: r.expires_at };
    },
    async tokenLogin(token) { /* break-glass env token */ },
    async check(session) { /* revalidate persisted session */ },
    async logout(session) { /* revoke */ },
  },
  pages: [
    {
      kind: 'dashboard', id: 'overview', label: 'overview', refresh: 60,
      load: (s) => get('/api/admin/overview', s),
      widgets: [
        { type: 'stat', label: 'users', value: (d: any) => d.totals.users },
        { type: 'line', label: 'signups / day', span: 2, series: (d: any) => d.series.signups },
        { type: 'bar',  label: 'top pages',     span: 2, bars: (d: any) => d.top },
      ],
    },
    {
      kind: 'resource', id: 'users', label: 'users',
      resource: {
        load: (s, q) => get(`/api/admin/users?q=${q.q}&limit=${q.limit}&offset=${q.offset}`, s),
        columns: [
          { key: 'email', label: 'email' },
          { key: 'is_admin', label: 'role', badge: (r) => (r.is_admin ? 'on' : null) },
        ],
        actions: [{ label: 'delete', danger: true, run: (s, r) => del(`/api/admin/users/${r.id}`, s) }],
      },
    },
    {
      kind: 'form', id: 'banner', label: 'announcement',
      form: {
        load: (s) => get('/api/admin/announcement', s),
        fields: [
          { key: 'text', label: 'message', type: 'textarea' },
          { key: 'active', label: 'published', type: 'toggle' },
        ],
        save: (s, v) => put('/api/admin/announcement', v, s),
      },
    },
  ],
};

mount(Panel, { target: document.getElementById('app')!, props: { config } });
```

## What you get

- **Login** — email + password, optional break-glass token mode, session persisted in `localStorage` and revalidated via `check()`.
- **Dashboard** — stat cards, hand-rolled SVG line charts, bar rows, top-N lists; optional auto-refresh.
- **Resources** — searchable, paged tables with badges and (danger-confirmed) row actions.
- **Forms** — text / textarea / toggle fields with load/save round-trip.
- **Theme** — `corepanel/theme.css`: dark-first, light via OS preference or `data-mode`, one `--cp-accent` to brand it.

## Install

```sh
bun add github:one-more-refactor/corepanel   # or npm/pnpm equivalent
```

Peer dependency: `svelte@^5`. Ships as source — your bundler (Vite + vite-plugin-svelte) compiles it.

## Design law

Monospace. Square corners (enforced). One accent. No gradients, glows, or shadows. Charts are plain SVG — no chart library will be added.

## License

[MIT](LICENSE).
