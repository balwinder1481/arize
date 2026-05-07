<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatUnits } from 'viem';

  export let detail: {
    address: string;
    uid: number;
    referrerId: number;
    isRegistered: boolean;
    directReferrals: number;
    availableBalance: bigint;
    totalWithdrawn: bigint;
    totalRoi: bigint;
    totalReferral: bigint;
    totalLevel: bigint;
    packages: Array<{
      idx: number; amount: bigint; used: bigint; roiUsed: bigint;
      startTime: number; daysClaimed: number; dailyRoi: number;
      isActive: boolean; packageType: number;
    }>;
  };

  const dispatch = createEventDispatcher<{ migrate: { old: string; newAddr: string } }>();

  let copied      = false;
  let showMigrate = false;
  let newAddr     = '';

  function fmt(v: bigint | undefined) {
    if (v === undefined || v === null) return '$0.00';
    return '$' + Number(formatUnits(v, 18)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtN(v: bigint | undefined) {
    if (v === undefined || v === null) return '0.00';
    return Number(formatUnits(v, 18)).toFixed(2);
  }

  function copyAddr() {
    navigator.clipboard.writeText(detail.address);
    copied = true;
    setTimeout(() => copied = false, 1500);
  }

  function startMigrate() { showMigrate = true; newAddr = ''; }
  function cancelMigrate() { showMigrate = false; newAddr = ''; }
  function confirmMigrate() {
    if (!newAddr || !newAddr.startsWith('0x') || newAddr.length !== 42) return;
    dispatch('migrate', { old: detail.address, newAddr });
    showMigrate = false;
  }

  $: activePackage = detail.packages.find(p => p.isActive) ?? detail.packages[detail.packages.length - 1] ?? null;
  $: totalInvested = detail.packages.filter(p => p.packageType !== 1).reduce((s, p) => s + p.amount, 0n);
  $: roiCap = activePackage ? activePackage.amount * 2n : 0n;
  $: workingCap = activePackage ? activePackage.amount * 4n : 0n;
  $: limitUsed = activePackage ? activePackage.used : 0n;
  $: limitPct  = workingCap > 0n ? Math.min(100, Number(limitUsed * 100n / workingCap)) : 0;
</script>

<div class="border-t border-border p-4 space-y-4" style="background:rgba(0,0,0,0.15)">

  <!-- Address + copy -->
  <div class="rounded-xl border border-border px-3 py-2.5" style="background:rgba(0,255,231,0.03)">
    <p class="mb-1 text-xs text-text-muted">Full Address</p>
    <div class="flex items-center justify-between gap-2">
      <p class="break-all font-mono text-xs text-text-primary">{detail.address}</p>
      <button on:click={copyAddr}
              class="shrink-0 rounded-lg p-2 text-xs transition-colors"
              style="background:rgba(0,255,231,0.1); color:#00FFE7">
        {copied ? '✓' : '⧉'}
      </button>
    </div>
    <p class="mt-1 text-xs text-text-muted">ID: AB{detail.uid} · Referrer: AB{detail.referrerId} · Directs: {detail.directReferrals}</p>
  </div>

  <!-- Current Package -->
  {#if activePackage}
    <div>
      <div class="mb-2 flex items-center gap-2">
        <p class="text-sm font-bold text-text-primary">Current Package</p>
        <span class="rounded-full px-2 py-0.5 text-xs font-bold"
              style="background:{activePackage.isActive ? 'rgba(54,255,111,0.15)' : 'rgba(255,88,51,0.15)'}; color:{activePackage.isActive ? '#36FF6F' : '#FF5833'}">
          {activePackage.isActive ? 'Active' : 'Expired'}
        </span>
        {#if activePackage.packageType === 1}
          <span class="rounded-full px-2 py-0.5 text-xs font-bold" style="background:rgba(255,140,66,0.15); color:#FF8C42">Granted</span>
        {/if}
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {#each [
          { k: 'Amount',      v: fmt(activePackage.amount) },
          { k: 'Days Claimed', v: activePackage.daysClaimed.toString() },
          { k: 'ROI Used',    v: fmt(activePackage.roiUsed) },
          { k: 'Total Used',  v: fmt(activePackage.used) },
        ] as s}
          <div class="rounded-xl px-3 py-2" style="background:var(--color-surface-3)">
            <p class="text-xs text-text-muted">{s.k}</p>
            <p class="mt-0.5 text-sm font-bold text-text-primary">{s.v}</p>
          </div>
        {/each}
      </div>
      <!-- 4X Cap Progress -->
      <div class="mt-2 rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
        <div class="flex justify-between text-xs text-text-muted mb-1.5">
          <span>4× Earning Cap</span>
          <span>{fmt(limitUsed)} / {fmt(workingCap)}</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full" style="background:var(--color-surface-2)">
          <div class="h-full rounded-full transition-all"
               style="width:{limitPct}%; background:linear-gradient(90deg,#00FFE7,#1762FF)"></div>
        </div>
        <p class="mt-1 text-right text-xs text-text-muted">{limitPct}% used</p>
      </div>
    </div>
  {:else}
    <div class="rounded-xl border border-border py-6 text-center text-sm text-text-muted">No packages yet</div>
  {/if}

  <!-- Income Stats -->
  <div>
    <p class="mb-2 text-sm font-bold text-text-primary">Income Overview</p>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {#each [
        { k: 'Total Invested',   v: fmt(totalInvested),             c: '#E0E6FF' },
        { k: 'Available Bal',    v: fmt(detail.availableBalance),   c: '#36FF6F' },
        { k: 'Total ROI',        v: fmt(detail.totalRoi),           c: '#00FFE7' },
        { k: 'Referral Income',  v: fmt(detail.totalReferral),      c: '#f59e0b' },
        { k: 'Level Income',     v: fmt(detail.totalLevel),         c: '#1762FF' },
        { k: 'Total Withdrawn',  v: fmt(detail.totalWithdrawn),     c: '#FF6B9D' },
      ] as s}
        <div class="rounded-xl px-3 py-2" style="background:var(--color-surface-3)">
          <p class="text-xs text-text-muted">{s.k}</p>
          <p class="mt-0.5 text-sm font-bold" style="color:{s.c}">{s.v}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- All Packages -->
  {#if detail.packages.length > 0}
    <div>
      <p class="mb-2 text-sm font-bold text-text-primary">All Packages ({detail.packages.length})</p>
      <div class="space-y-1.5">
        {#each detail.packages as pkg}
          <div class="flex items-center justify-between rounded-xl px-3 py-2 text-xs"
               style="background:var(--color-surface-3); border-left: 3px solid {pkg.isActive ? '#36FF6F' : '#555'}">
            <div>
              <span class="font-bold text-text-primary">Pkg #{pkg.idx + 1}</span>
              <span class="ml-2 text-text-muted">{fmt(pkg.amount)}</span>
              {#if pkg.packageType === 1}<span class="ml-1 text-amber-400">Granted</span>{/if}
            </div>
            <div class="text-right text-text-muted">
              <span>{pkg.dailyRoi/100}% ROI</span>
              <span class="ml-2">{pkg.daysClaimed}d claimed</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="border-t border-border pt-4 space-y-3">
    <!-- Address Migration -->
    <div>
      <h4 class="mb-2 text-sm font-bold text-amber-400">⚠ Migrate Address</h4>
      {#if !showMigrate}
        <button on:click={startMigrate}
                class="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
                style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
          Migrate Address
        </button>
      {:else}
        <div class="space-y-2">
          <div class="rounded-xl border px-3 py-2 text-xs" style="border-color:rgba(255,140,66,0.3);background:rgba(255,140,66,0.05)">
            <p class="text-text-muted">Current:</p>
            <p class="font-mono text-text-primary">{detail.address}</p>
          </div>
          <input bind:value={newAddr} type="text" placeholder="New Address (0x...)"
                 class="w-full rounded-xl border border-border px-3 py-2 font-mono text-sm outline-none"
                 style="background:var(--color-surface-3); color:var(--color-text-primary)" />
          <div class="flex gap-2">
            <button on:click={confirmMigrate} disabled={!newAddr || newAddr.length !== 42}
                    class="flex-1 rounded-xl py-2 text-sm font-bold text-white disabled:opacity-40"
                    style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
              Confirm
            </button>
            <button on:click={cancelMigrate}
                    class="rounded-xl px-4 py-2 text-sm font-bold btn-outline">
              Cancel
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
