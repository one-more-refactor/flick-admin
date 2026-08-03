<script lang="ts">
  let { label, bars }: { label: string; bars: Array<{ label: string; value: number }> } = $props();
  let max = $derived(Math.max(1, ...bars.map((b) => b.value)));
</script>

<div class="cp-bars">
  <span class="cp-bars-label">{label}</span>
  {#if bars.length === 0}
    <div class="cp-bars-empty">no data yet</div>
  {:else}
    <div class="cp-bars-rows">
      {#each bars as b (b.label)}
        <div class="cp-bar-row">
          <span class="cp-bar-key">{b.label}</span>
          <span class="cp-bar-track"><i style="width: {(b.value / max) * 100}%"></i></span>
          <span class="cp-bar-val">{b.value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .cp-bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid var(--cp-line);
    background: var(--cp-panel);
    min-width: 0;
  }
  .cp-bars-label {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cp-dim);
  }
  .cp-bars-empty {
    color: var(--cp-dim);
    padding: 24px 0;
    text-align: center;
  }
  .cp-bars-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cp-bar-row {
    display: grid;
    grid-template-columns: minmax(48px, auto) 1fr auto;
    gap: 10px;
    align-items: center;
  }
  .cp-bar-key {
    font-size: 11px;
    color: var(--cp-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }
  .cp-bar-track {
    height: 8px;
    background: var(--cp-line);
    display: block;
  }
  .cp-bar-track i {
    display: block;
    height: 100%;
    background: var(--cp-accent);
  }
  .cp-bar-val {
    font-variant-numeric: tabular-nums;
    font-size: 11px;
  }
</style>
