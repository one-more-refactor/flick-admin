<script lang="ts">
  import type { FormDef, Session } from './types';

  let { session, form }: { session: Session; form: FormDef } = $props();

  let values = $state<Record<string, unknown>>({});
  let loaded = $state(false);
  let error = $state('');
  let saved = $state(false);
  let busy = $state(false);

  $effect(() => {
    form
      .load(session)
      .then((v) => {
        values = { ...v };
        loaded = true;
      })
      .catch((err) => (error = err instanceof Error ? err.message : 'load failed'));
  });

  async function save(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    saved = false;
    error = '';
    try {
      await form.save(session, values);
      saved = true;
      setTimeout(() => (saved = false), 2500);
    } catch (err) {
      error = err instanceof Error ? err.message : 'save failed';
    } finally {
      busy = false;
    }
  }
</script>

{#if !loaded && !error}
  <p class="cp-loading">loading…</p>
{:else}
  <form class="cp-form" onsubmit={save}>
    {#if form.description}<p class="desc">{form.description}</p>{/if}
    {#each form.fields as field (field.key)}
      <label class="field" class:row={field.type === 'toggle'}>
        <span>{field.label}</span>
        {#if field.type === 'text'}
          <input type="text" bind:value={values[field.key]} placeholder={field.placeholder ?? ''} />
        {:else if field.type === 'textarea'}
          <textarea rows="3" bind:value={values[field.key]} placeholder={field.placeholder ?? ''}
          ></textarea>
        {:else if field.type === 'toggle'}
          <button
            class="toggle"
            class:on={Boolean(values[field.key])}
            type="button"
            role="switch"
            aria-checked={Boolean(values[field.key])}
            onclick={() => (values[field.key] = !values[field.key])}
          >
            {values[field.key] ? 'ON' : 'OFF'}
          </button>
        {/if}
      </label>
    {/each}
    {#if error}<p class="cp-error" role="alert">{error}</p>{/if}
    <div class="foot">
      <button class="save" type="submit" disabled={busy}>{busy ? 'saving…' : 'save'}</button>
      {#if saved}<span class="ok">saved ✓</span>{/if}
    </div>
  </form>
{/if}

<style>
  .cp-loading {
    color: var(--cp-dim);
  }
  .cp-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 560px;
    padding: 20px;
    border: 1px solid var(--cp-line);
    background: var(--cp-panel);
  }
  .desc {
    margin: 0;
    color: var(--cp-dim);
    font-size: 12px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .field.row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .field span {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cp-dim);
  }
  input,
  textarea {
    font: inherit;
    color: var(--cp-ink);
    background: var(--cp-bg);
    border: 1px solid var(--cp-line);
    padding: 8px 10px;
    outline: none;
    resize: vertical;
  }
  input:focus,
  textarea:focus {
    border-color: var(--cp-accent);
  }
  .toggle {
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--cp-dim);
    background: none;
    border: 1px solid var(--cp-line);
    padding: 4px 14px;
    cursor: pointer;
  }
  .toggle.on {
    color: var(--cp-bg);
    background: var(--cp-accent);
    border-color: var(--cp-accent);
  }
  .cp-error {
    margin: 0;
    color: var(--cp-accent);
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .save {
    font: inherit;
    font-weight: 700;
    color: var(--cp-bg);
    background: var(--cp-accent);
    border: none;
    padding: 8px 22px;
    cursor: pointer;
    letter-spacing: 0.06em;
  }
  .save:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .ok {
    color: var(--cp-ok);
    font-size: 12px;
  }
</style>
