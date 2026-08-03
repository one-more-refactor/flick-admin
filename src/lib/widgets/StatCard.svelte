<script lang="ts">
  let { label, value, hint }: { label: string; value: string | number; hint?: string } = $props();
</script>

<div class="cp-stat">
  <span class="cp-stat-label">{label}</span>
  <span class="cp-stat-value">{value}</span>
  {#if hint}<span class="cp-stat-hint">{hint}</span>{/if}
</div>

<style>
  .cp-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 16px;
    border: 1px solid var(--cp-line);
    background: var(--cp-panel);
    min-width: 0;
  }
  .cp-stat-label {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cp-dim);
  }
  .cp-stat-value {
    font-size: 26px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }
  .cp-stat-hint {
    font-size: 11px;
    color: var(--cp-dim);
  }
</style>
