<script lang="ts">
  import { isConnected, address, chainId } from '$lib/web3/store';
  import { getAppKit } from '$lib/web3/config';
  import { env } from '$lib/constants/env';

  export let size: 'sm' | 'md' | 'lg' = 'md';
  const TARGET_CHAIN_ID = env.chainId;
  const CHAIN_NAME      = env.isMainnet ? 'BSC' : 'BSC Testnet';
  const CHAIN_COLOR     = '#F0B90B';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2   text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  $: wrongNetwork = $isConnected && $chainId !== undefined && $chainId !== TARGET_CHAIN_ID;
  $: shortAddr    = $address ? `${$address.slice(0, 6)}…${$address.slice(-4)}` : '';

  function handleConnect() { getAppKit()?.open(); }
  function handleAccount()  { getAppKit()?.open({ view: 'Account' }); }
  function handleNetwork()  { getAppKit()?.open({ view: 'Networks' }); }
</script>

<!-- ── NOT CONNECTED ─────────────────────────────────────── -->
{#if !$isConnected}
  <button
    on:click={handleConnect}
    class="{sizeClasses[size]} inline-flex items-center gap-2 rounded-xl font-bold
           text-black shadow-lg transition-all duration-300 hover:scale-[1.02]"
    style="background:linear-gradient(135deg,#f59e0b,#d97706);
           box-shadow:0 4px 15px rgba(245,158,11,0.35)">
    <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
    </svg>
    Connect Wallet
  </button>

<!-- ── WRONG NETWORK ──────────────────────────────────────── -->
{:else if wrongNetwork}
  <button
    on:click={handleNetwork}
    class="{sizeClasses[size]} inline-flex items-center gap-2 rounded-xl font-semibold
           text-white shadow-lg transition-all hover:opacity-90"
    style="background:linear-gradient(135deg,#dc2626,#b91c1c)">
    <span class="h-2 w-2 animate-pulse rounded-full bg-white"></span>
    Wrong Network
  </button>

<!-- ── CONNECTED ─────────────────────────────────────────── -->
{:else if $isConnected && $address}
  <div class="flex items-center gap-1.5">

    <!-- Chain pill → opens Networks modal -->
    <button
      on:click={handleNetwork}
      class="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 transition-all hover:opacity-80"
      style="background:rgba(240,185,11,0.08);border-color:rgba(240,185,11,0.25)"
      title="Network: {CHAIN_NAME}">
      <span class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
            style="background:{CHAIN_COLOR};color:#000">B</span>
      <span class="hidden text-xs font-medium sm:block" style="color:{CHAIN_COLOR}">{CHAIN_NAME}</span>
    </button>

    <!-- Address pill → opens Account modal (disconnect, copy, etc.) -->
    <button
      on:click={handleAccount}
      class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 transition-all hover:border-opacity-60"
      style="background:rgba(245,158,11,0.07);border-color:rgba(245,158,11,0.3)">
      <span class="h-2 w-2 rounded-full" style="background:linear-gradient(135deg,#f59e0b,#d97706)"></span>
      <span class="{sizeClasses[size].includes('text-xs') ? 'text-xs' : 'text-sm'} font-medium text-text-primary">{shortAddr}</span>
      <svg class="h-3.5 w-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>
  </div>
{/if}
