<script lang="ts">
  import type { Resource, Session } from './types';

  let { session, resource }: { session: Session; resource: Resource } = $props();

  const pageSize = resource.pageSize ?? 50;
  let q = $state('');
  let offset = $state(0);
  let total = $state(0);
  let rows = $state<any[]>([]);
  let error = $state('');
  let busy = $state(false);
  /** Row index whose danger action is awaiting the "sure?" click. */
  let confirming = $state<{ row: number; action: number } | null>(null);

  async function fetchRows() {
    busy = true;
    try {
      const res = await resource.load(session, { q, limit: pageSize, offset });
      total = res.total;
      rows = res.rows;
      error = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'load failed';
    } finally {
      busy = false;
      confirming = null;
    }
  }

  let searchTimer: ReturnType<typeof setTimeout>;
  function onSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      offset = 0;
      fetchRows();
    }, 250);
  }

  async function runAction(ri: number, ai: number) {
    const action = resource.actions![ai];
    if (action.danger && (confirming?.row !== ri || confirming?.action !== ai)) {
      confirming = { row: ri, action: ai };
      return;
    }
    confirming = null;
    try {
      await action.run(session, rows[ri]);
      await fetchRows();
    } catch (err) {
      error = err instanceof Error ? err.message : 'action failed';
    }
  }

  function cell(row: any, col: (typeof resource.columns)[number]): string {
    if (col.render) return col.render(row);
    const v = row[col.key];
    return v === null || v === undefined ? '' : String(v);
  }

  $effect(() => {
    fetchRows();
  });
</script>

<div class="cp-res">
  <div class="cp-res-bar">
    {#if resource.searchable !== false}
      <input class="cp-search" type="search" placeholder="search…" bind:value={q} oninput={onSearch} />
    {/if}
    <span class="cp-count" class:busy>{total} total</span>
  </div>

  {#if error}<p class="cp-error" role="alert">{error}</p>{/if}

  <div class="cp-res-scroll">
    <table>
      <thead>
        <tr>
          {#each resource.columns as col (col.key)}
            <th class:num={col.num}>{col.label}</th>
          {/each}
          {#if resource.actions?.length}<th class="acts"></th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, ri (ri)}
          <tr>
            {#each resource.columns as col (col.key)}
              <td class:num={col.num}>
                {#if col.badge && col.badge(row) !== null}
                  <span class="chip" class:on={col.badge(row) === 'on'}>{cell(row, col)}</span>
                {:else}
                  {cell(row, col)}
                {/if}
              </td>
            {/each}
            {#if resource.actions?.length}
              <td class="acts">
                {#each resource.actions as action, ai (action.label)}
                  {#if !action.when || action.when(row)}
                    <button
                      class="act"
                      class:danger={action.danger}
                      type="button"
                      onclick={() => runAction(ri, ai)}
                    >
                      {confirming?.row === ri && confirming?.action === ai ? 'sure?' : action.label}
                    </button>
                  {/if}
                {/each}
              </td>
            {/if}
          </tr>
        {/each}
        {#if rows.length === 0 && !busy}
          <tr><td class="empty" colspan="99">nothing here</td></tr>
        {/if}
      </tbody>
    </table>
  </div>

  {#if total > pageSize}
    <div class="cp-pager">
      <button
        type="button"
        disabled={offset === 0}
        onclick={() => {
          offset = Math.max(0, offset - pageSize);
          fetchRows();
        }}>← prev</button
      >
      <span>{offset + 1}–{Math.min(offset + pageSize, total)} of {total}</span>
      <button
        type="button"
        disabled={offset + pageSize >= total}
        onclick={() => {
          offset += pageSize;
          fetchRows();
        }}>next →</button
      >
    </div>
  {/if}
</div>

<style>
  .cp-res {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cp-res-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cp-search {
    font: inherit;
    color: var(--cp-ink);
    background: var(--cp-panel);
    border: 1px solid var(--cp-line);
    padding: 6px 10px;
    width: min(320px, 100%);
    outline: none;
  }
  .cp-search:focus {
    border-color: var(--cp-accent);
  }
  .cp-count {
    margin-left: auto;
    font-size: 11px;
    color: var(--cp-dim);
    font-variant-numeric: tabular-nums;
  }
  .cp-count.busy {
    opacity: 0.4;
  }
  .cp-error {
    color: var(--cp-accent);
    margin: 0;
  }
  .cp-res-scroll {
    overflow-x: auto;
    border: 1px solid var(--cp-line);
    background: var(--cp-panel);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th {
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cp-dim);
    font-weight: 400;
    padding: 8px 12px;
    border-bottom: 1px solid var(--cp-line);
    white-space: nowrap;
  }
  td {
    padding: 7px 12px;
    border-bottom: 1px solid var(--cp-line);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 280px;
  }
  tr:last-child td {
    border-bottom: none;
  }
  th.num,
  td.num {
    text-align: right;
  }
  td.empty {
    color: var(--cp-dim);
    text-align: center;
    padding: 24px;
  }
  .chip {
    display: inline-block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 1px 7px;
    border: 1px solid var(--cp-line);
    color: var(--cp-dim);
  }
  .chip.on {
    border-color: var(--cp-accent);
    color: var(--cp-accent);
  }
  td.acts {
    text-align: right;
  }
  .act {
    font: inherit;
    font-size: 11px;
    color: var(--cp-dim);
    background: none;
    border: 1px solid var(--cp-line);
    padding: 2px 8px;
    margin-left: 6px;
    cursor: pointer;
  }
  .act:hover {
    color: var(--cp-ink);
    border-color: var(--cp-dim);
  }
  .act.danger {
    color: var(--cp-accent);
    border-color: var(--cp-accent);
  }
  .cp-pager {
    display: flex;
    align-items: center;
    gap: 14px;
    justify-content: center;
    font-size: 11px;
    color: var(--cp-dim);
    font-variant-numeric: tabular-nums;
  }
  .cp-pager button {
    font: inherit;
    font-size: 11px;
    color: var(--cp-ink);
    background: none;
    border: 1px solid var(--cp-line);
    padding: 3px 10px;
    cursor: pointer;
  }
  .cp-pager button:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
