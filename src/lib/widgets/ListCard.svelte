<script lang="ts">
  let { label, header, rows }: { label: string; header: string[]; rows: string[][] } = $props();
</script>

<div class="cp-list">
  <span class="cp-list-label">{label}</span>
  {#if rows.length === 0}
    <div class="cp-list-empty">no data yet</div>
  {:else}
    <div class="cp-list-scroll">
      <table>
        <thead>
          <tr>{#each header as h (h)}<th>{h}</th>{/each}</tr>
        </thead>
        <tbody>
          {#each rows as row, i (i)}
            <tr>{#each row as cell, j (j)}<td>{cell}</td>{/each}</tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .cp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border: 1px solid var(--cp-line);
    background: var(--cp-panel);
    min-width: 0;
  }
  .cp-list-label {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cp-dim);
  }
  .cp-list-empty {
    color: var(--cp-dim);
    padding: 24px 0;
    text-align: center;
  }
  .cp-list-scroll {
    overflow-x: auto;
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
    padding: 4px 10px 6px 0;
    border-bottom: 1px solid var(--cp-line);
  }
  td {
    padding: 5px 10px 5px 0;
    border-bottom: 1px solid var(--cp-line);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 260px;
  }
  tr:last-child td {
    border-bottom: none;
  }
</style>
