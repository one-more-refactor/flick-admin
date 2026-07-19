<script lang="ts">
  import type { PanelConfig, Session } from './types';
  import Login from './Login.svelte';
  import Dashboard from './Dashboard.svelte';
  import ResourceView from './ResourceView.svelte';
  import FormView from './FormView.svelte';

  let { config }: { config: PanelConfig } = $props();

  const storeKey = `cp.session.${config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  let session = $state<Session | null>(null);
  let checking = $state(true);
  let pageId = $state(location.hash.slice(2) || config.pages[0]?.id || '');

  let page = $derived(config.pages.find((p) => p.id === pageId) ?? config.pages[0]);

  // Restore a persisted session; drop it if expired or rejected by check().
  $effect(() => {
    const raw = localStorage.getItem(storeKey);
    if (!raw) {
      checking = false;
      return;
    }
    let stored: Session | null = null;
    try {
      stored = JSON.parse(raw) as Session;
    } catch {
      localStorage.removeItem(storeKey);
    }
    if (!stored || (stored.expires_at && stored.expires_at * 1000 < Date.now())) {
      localStorage.removeItem(storeKey);
      checking = false;
      return;
    }
    const candidate = stored;
    (config.auth.check ? config.auth.check(candidate) : Promise.resolve(true))
      .then((ok) => {
        if (ok) session = candidate;
        else localStorage.removeItem(storeKey);
      })
      .catch(() => localStorage.removeItem(storeKey))
      .finally(() => (checking = false));
  });

  $effect(() => {
    const onHash = () => (pageId = location.hash.slice(2) || config.pages[0]?.id || '');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  function onlogin(s: Session) {
    session = s;
    localStorage.setItem(storeKey, JSON.stringify(s));
  }

  async function logout() {
    if (session && config.auth.logout) {
      try {
        await config.auth.logout(session);
      } catch {
        // token already dead server-side is fine
      }
    }
    session = null;
    localStorage.removeItem(storeKey);
  }

  function nav(id: string) {
    location.hash = `#/${id}`;
    pageId = id;
  }
</script>

{#if checking}
  <div class="cp-boot">…</div>
{:else if !session}
  <Login title={config.title} auth={config.auth} {onlogin} />
{:else}
  <div class="cp-shell">
    <aside class="cp-side">
      <div class="cp-brand">{config.title}<span class="cur">_</span></div>
      <nav class="cp-nav">
        {#each config.pages as p (p.id)}
          <button class="cp-navitem" class:on={p.id === page?.id} type="button" onclick={() => nav(p.id)}>
            {p.label}
          </button>
        {/each}
      </nav>
      <div class="cp-session">
        <span class="cp-who" title={session.label}>{session.label}</span>
        <button class="cp-out" type="button" onclick={logout}>sign out</button>
        {#if config.footer}<span class="cp-foot">{config.footer}</span>{/if}
      </div>
    </aside>
    <main class="cp-main">
      <h1 class="cp-h1">{page?.label}</h1>
      {#key page?.id}
        {#if page?.kind === 'dashboard'}
          <Dashboard {session} load={page.load} widgets={page.widgets} refresh={page.refresh} />
        {:else if page?.kind === 'resource'}
          <ResourceView {session} resource={page.resource} />
        {:else if page?.kind === 'form'}
          <FormView {session} form={page.form} />
        {/if}
      {/key}
    </main>
  </div>
{/if}

<style>
  .cp-boot {
    min-height: 100vh;
    display: grid;
    place-items: center;
    color: var(--cp-dim);
  }
  .cp-shell {
    display: grid;
    grid-template-columns: 210px 1fr;
    min-height: 100vh;
  }
  .cp-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px 16px;
    border-right: 1px solid var(--cp-line);
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .cp-brand {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .cur {
    color: var(--cp-accent);
  }
  .cp-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cp-navitem {
    font: inherit;
    text-align: left;
    color: var(--cp-dim);
    background: none;
    border: none;
    border-left: 2px solid transparent;
    padding: 6px 10px;
    cursor: pointer;
    letter-spacing: 0.04em;
  }
  .cp-navitem:hover {
    color: var(--cp-ink);
  }
  .cp-navitem.on {
    color: var(--cp-ink);
    border-left-color: var(--cp-accent);
    background: var(--cp-panel);
  }
  .cp-session {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 1px solid var(--cp-line);
    padding-top: 12px;
  }
  .cp-who {
    font-size: 11px;
    color: var(--cp-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cp-out {
    font: inherit;
    font-size: 11px;
    color: var(--cp-ink);
    background: none;
    border: 1px solid var(--cp-line);
    padding: 4px 10px;
    cursor: pointer;
    align-self: flex-start;
  }
  .cp-out:hover {
    border-color: var(--cp-accent);
    color: var(--cp-accent);
  }
  .cp-foot {
    font-size: 10px;
    color: var(--cp-dim);
  }
  .cp-main {
    padding: 24px 28px 48px;
    min-width: 0;
    max-width: 1200px;
  }
  .cp-h1 {
    margin: 0 0 18px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--cp-dim);
  }
  @media (max-width: 720px) {
    .cp-shell {
      grid-template-columns: 1fr;
    }
    .cp-side {
      position: static;
      height: auto;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      border-right: none;
      border-bottom: 1px solid var(--cp-line);
    }
    .cp-nav {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .cp-navitem.on {
      border-left: none;
      border-bottom: 2px solid var(--cp-accent);
    }
    .cp-session {
      margin-top: 0;
      margin-left: auto;
      border-top: none;
      padding-top: 0;
    }
  }
</style>
