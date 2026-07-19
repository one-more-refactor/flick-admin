<script lang="ts">
  import type { AuthProvider, Session } from './types';

  let {
    title,
    auth,
    onlogin,
  }: { title: string; auth: AuthProvider; onlogin: (s: Session) => void } = $props();

  let mode = $state<'password' | 'token'>('password');
  let email = $state('');
  let password = $state('');
  let token = $state('');
  let error = $state('');
  let busy = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    busy = true;
    try {
      const session =
        mode === 'token' && auth.tokenLogin
          ? await auth.tokenLogin(token.trim())
          : await auth.login(email.trim(), password);
      onlogin(session);
    } catch (err) {
      error = err instanceof Error ? err.message : 'sign-in failed';
    } finally {
      busy = false;
    }
  }
</script>

<div class="cp-login">
  <form class="cp-login-card" onsubmit={submit}>
    <h1>{title}<span class="cur">_</span></h1>
    <p class="sub">operator access</p>

    {#if mode === 'password'}
      <label>
        <span>email</span>
        <input type="email" bind:value={email} autocomplete="username" required />
      </label>
      <label>
        <span>password</span>
        <input type="password" bind:value={password} autocomplete="current-password" required />
      </label>
    {:else}
      <label>
        <span>admin token</span>
        <input type="password" bind:value={token} autocomplete="off" required />
      </label>
    {/if}

    {#if error}<p class="err" role="alert">{error}</p>{/if}

    <button class="go" type="submit" disabled={busy}>
      {busy ? 'signing in…' : 'sign in →'}
    </button>

    {#if auth.tokenLogin}
      <button
        class="alt"
        type="button"
        onclick={() => {
          mode = mode === 'password' ? 'token' : 'password';
          error = '';
        }}
      >
        {mode === 'password' ? 'use an admin token instead' : 'use email + password instead'}
      </button>
    {/if}
  </form>
</div>

<style>
  .cp-login {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .cp-login-card {
    width: min(360px, 100%);
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 28px;
    border: 1px solid var(--cp-line);
    background: var(--cp-panel);
  }
  h1 {
    margin: 0;
    font-size: 18px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .cur {
    color: var(--cp-accent);
  }
  .sub {
    margin: -10px 0 4px;
    font-size: 11px;
    color: var(--cp-dim);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  label span {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cp-dim);
  }
  input {
    font: inherit;
    color: var(--cp-ink);
    background: var(--cp-bg);
    border: 1px solid var(--cp-line);
    padding: 8px 10px;
    outline: none;
  }
  input:focus {
    border-color: var(--cp-accent);
  }
  .err {
    margin: 0;
    color: var(--cp-accent);
    font-size: 12px;
  }
  .go {
    font: inherit;
    font-weight: 700;
    color: var(--cp-bg);
    background: var(--cp-accent);
    border: none;
    padding: 10px;
    cursor: pointer;
    letter-spacing: 0.06em;
  }
  .go:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .alt {
    font: inherit;
    font-size: 11px;
    color: var(--cp-dim);
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }
  .alt:hover {
    color: var(--cp-ink);
  }
</style>
