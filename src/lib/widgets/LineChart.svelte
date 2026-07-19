<script lang="ts">
  let { label, series }: { label: string; series: Array<{ x: string; y: number }> } = $props();

  const W = 560;
  const H = 150;
  const PAD = { t: 10, r: 8, b: 22, l: 40 };

  let max = $derived(Math.max(1, ...series.map((p) => p.y)));
  let pts = $derived(
    series.map((p, i) => {
      const x =
        PAD.l + (series.length < 2 ? 0 : (i / (series.length - 1)) * (W - PAD.l - PAD.r));
      const y = H - PAD.b - (p.y / max) * (H - PAD.t - PAD.b);
      return { ...p, px: x, py: y };
    })
  );
  let path = $derived(pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' '));
  let last = $derived(pts.at(-1));
  let gridYs = $derived([0.25, 0.5, 0.75, 1].map((f) => H - PAD.b - f * (H - PAD.t - PAD.b)));
</script>

<div class="cp-chart">
  <span class="cp-chart-label">{label}</span>
  {#if series.length === 0}
    <div class="cp-chart-empty">no data yet</div>
  {:else}
    <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={label}>
      {#each gridYs as y (y)}
        <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} class="grid" />
      {/each}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} class="axis" />
      <text x={PAD.l - 6} y={PAD.t + 8} class="tick" text-anchor="end">{max}</text>
      <text x={PAD.l - 6} y={H - PAD.b} class="tick" text-anchor="end">0</text>
      <path d={path} class="line" />
      {#if last}
        <circle cx={last.px} cy={last.py} r="3" class="dot" />
        <text x={Math.min(last.px, W - PAD.r - 4)} y={Math.max(last.py - 8, 10)} class="val" text-anchor="end">{last.y}</text>
      {/if}
      {#if series.length > 1}
        <text x={PAD.l} y={H - 6} class="tick">{series[0].x}</text>
        <text x={W - PAD.r} y={H - 6} class="tick" text-anchor="end">{series.at(-1)?.x}</text>
      {/if}
    </svg>
  {/if}
</div>

<style>
  .cp-chart {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border: 1px solid var(--cp-line);
    background: var(--cp-panel);
    min-width: 0;
  }
  .cp-chart-label {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cp-dim);
  }
  .cp-chart-empty {
    color: var(--cp-dim);
    padding: 24px 0;
    text-align: center;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .grid {
    stroke: var(--cp-line);
    stroke-width: 0.5;
  }
  .axis {
    stroke: var(--cp-line);
    stroke-width: 1;
  }
  .line {
    fill: none;
    stroke: var(--cp-accent);
    stroke-width: 1.5;
  }
  .dot {
    fill: var(--cp-accent);
  }
  .tick,
  .val {
    font-family: var(--cp-mono);
    font-size: 9px;
    fill: var(--cp-dim);
  }
  .val {
    fill: var(--cp-ink);
    font-weight: 700;
  }
</style>
