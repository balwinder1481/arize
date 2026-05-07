<script lang="ts">
  import { isConnected, address } from '$lib/web3/store';
  import { env } from '$lib/constants/env';
  import OverviewTab            from './components/OverviewTab.svelte';
  import UsersTab               from './components/UsersTab.svelte';
  import RegisterTab            from './components/RegisterTab.svelte';
  import ConfigTab              from './components/ConfigTab.svelte';
  import BonanzaTab             from './components/BonanzaTab.svelte';
  import DepositsWithdrawalsTab from './components/DepositsWithdrawalsTab.svelte';
  import WalletButton           from '$lib/components/WalletButton.svelte';

  // ── Auth ─────────────────────────────────────────────────
  $: isAdmin = $address
    ? env.admins.map(a => a.toLowerCase()).includes($address!.toLowerCase())
    : false;

  type Tab = 'overview' | 'users' | 'register' | 'config' | 'bonanza' | 'deposits';
  let activeTab: Tab = 'overview';

  const navTabs = [
    { id: 'overview',  icon: '📊', label: 'Overview' },
    { id: 'deposits',  icon: '💰', label: 'D&W'       },
    { id: 'users',     icon: '👥', label: 'Users'     },
    { id: 'register',  icon: '➕', label: 'Register'  },
    { id: 'config',    icon: '⚙️', label: 'Config'    },
    { id: 'bonanza',   icon: '🏆', label: 'Bonanza'  },
  ];
</script>

<svelte:head>
  <title>Admin — ArizeBiz</title>
</svelte:head>

<div class="min-h-screen" style="background:var(--color-surface)">

  <!-- Header -->
  <header class="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3">
    <a href="/" class="flex items-center gap-2">
      <div class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black"
           style="background:linear-gradient(135deg,#f59e0b,#d97706)">AB</div>
      <span class="font-bold">Arize<span class="gold-text">Biz</span>
        <span class="ml-1 rounded bg-red-600 px-1.5 py-0.5 text-xs text-white">ADMIN</span>
      </span>
    </a>
    <div class="flex items-center gap-2">
      <WalletButton size="sm" />
    </div>
  </header>

  <div class="mx-auto max-w-5xl px-4 py-6 pb-24">

    <!-- Not connected / not admin -->
    {#if !$isConnected}
      <div class="card mt-10 p-10 text-center">
        <div class="mb-4 text-4xl">🔒</div>
        <h2 class="mb-2 text-xl font-bold">Connect Wallet</h2>
        <p class="mb-6 text-text-secondary">Connect your admin wallet to access the panel.</p>
        <WalletButton size="lg" />
      </div>

    {:else if !isAdmin}
      <div class="card mt-10 p-10 text-center">
        <div class="mb-4 text-4xl">🚫</div>
        <h2 class="mb-2 text-xl font-bold text-error">Access Denied</h2>
        <p class="mb-2 text-text-secondary">This wallet is not authorized.</p>
        <p class="mb-6 font-mono text-xs text-text-muted">{$address}</p>
        <a href="/dashboard" class="btn-primary px-8 py-3">Go to Dashboard</a>
      </div>

    {:else}

      <!-- Desktop tab bar -->
      <div class="mb-5 hidden gap-1 rounded-xl border border-border p-1 sm:flex"
           style="background:var(--color-surface-2)">
        {#each navTabs as t}
          <button
            class="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors
                   {activeTab === t.id ? 'text-black' : 'text-text-secondary hover:text-text-primary'}"
            style="{activeTab === t.id ? 'background:linear-gradient(135deg,#f59e0b,#d97706)' : ''}"
            on:click={() => activeTab = t.id as Tab}>
            {t.icon} {t.label}
          </button>
        {/each}
      </div>

      <!-- ─── TAB COMPONENTS ──────────────────────────────────── -->
      {#if activeTab === 'overview'}
        <OverviewTab />
      {:else if activeTab === 'deposits'}
        <DepositsWithdrawalsTab />
      {:else if activeTab === 'users'}
        <UsersTab />
      {:else if activeTab === 'register'}
        <RegisterTab />
      {:else if activeTab === 'config'}
        <ConfigTab />
      {:else if activeTab === 'bonanza'}
        <BonanzaTab />
      {/if}
    {/if}
  </div>

  <!-- Mobile bottom nav (admin) -->
  {#if isAdmin && $isConnected}
    <nav class="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
         style="background:rgba(10,10,15,0.97);backdrop-filter:blur(12px);border-top:1px solid var(--color-border)">
      <div class="flex justify-around px-1 py-1.5">
        {#each navTabs as t}
          <button
            class="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition-all
                   {activeTab === t.id ? 'text-black' : 'text-text-muted'}"
            style="{activeTab === t.id ? 'background:linear-gradient(135deg,#f59e0b,#d97706)' : ''}"
            on:click={() => activeTab = t.id as Tab}>
            <span class="text-base leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        {/each}
      </div>
    </nav>
    <div class="h-16 sm:hidden"></div>
  {/if}
</div>
