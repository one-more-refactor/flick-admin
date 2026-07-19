<script lang="ts">
  import type { Session, Widget } from './types';
  import StatCard from './widgets/StatCard.svelte';
  import LineChart from './widgets/LineChart.svelte';
  import BarChart from './widgets/BarChart.svelte';
  import ListCard from './widgets/ListCard.svelte';

  let {
    session,
    load,
    widgets,
    refresh,
  }: {
    session: Session;
    load: (s: Session) => Promise<unknown>;
    widgets: Widget[];
    refresh?: number;
  } = $props();

  let data = $state<unknown>(null);
  let error = $state('');
  let stamp = $state<Date | null>(null);

  async function fetchData() {
    try {
      data = await load(session);
      stamp = new Date();
      error = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'load failed';
    }
  }

  $effect(() => {
    fetchData();
    if (refresh) {
      const t = setInterval(fetchData, refresh * 1000);
      return () => clearInterval(t);
    }
  });
</script>

<div class="cp-dash">
  <div class="cp-dash-bar">
    {#if stamp}
      <span class="cp-stamp">as of {stamp.toLocaleTimeString()}</span>
    {/if}
    <button class="cp-refresh" type="button" onclick={fetchData}>refresh ↻</button>
  </div>
  {#if error}
    <p class="cp-error" role="alert">{error}</p>
  {:else if data !== null}
    <div class="cp-grid">
      {#each widgets as w (w.label)}
        <div class="cell" style="--span: {w.span ?? 1}">
          {#if w.type === 'stat'}
            <StatCard label={w.label} value={w.value(data)} hint={w.hint?.(data)} />
          {:else if w.type === 'line'}
            <LineChart label={w.label} series={w.series(data)} />
          {:else if w.type === 'bar'}
            <BarChart label={w.label} bars={w.bars(data)} />
          {:else if w.type === 'list'}
            <ListCard label={w.label} header={w.header} rows={w.rows(data)} />
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="cp-loading">loading…</p>
  {/if}
</div>

<style>
  .cp-dash {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cp-dash-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  }
  .cp-stamp {
    font-size: 10.5px;
    color: var(--cp-dim);
    font-variant-numeric: tabular-nums;
  }
  .cp-refresh {
    font: inherit;
    font-size: 11px;
    color: var(--cp-dim);
    background: none;
    border: 1px solid var(--cp-line);
    padding: 3px 10px;
    cursor: pointer;
  }
  .cp-refresh:hover {
    color: var(--cp-ink);
    border-color: var(--cp-dim);
  }
  .cp-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .cell {
    grid-column: span var(--span);
    min-width: 0;
    display: grid;
  }
  @media (max-width: 900px) {
    .cp-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .cell {
      grid-column: span min(var(--span), 2);
    }
  }
  @media (max-width: 560px) {
    .cp-grid {
      grid-template-columns: 1fr;
    }
    .cell {
      grid-column: span 1;
    }
  }
  .cp-error {
    color: var(--cp-accent);
  }
  .cp-loading {
    color: var(--cp-dim);
  }
</style>
