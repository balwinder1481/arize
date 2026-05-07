<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatUnits } from 'viem';
  import type { IncomeData } from '$lib/types/dashboard';

  export let income: IncomeData;
  export let txLoading = false;
  export let readonly   = false;

  let withdrawAmt = '';

  const dispatch = createEventDispatcher<{
    claimROI:    void;
    checkRank:   void;
    claimSalary: void;
    withdraw:    { amount: string };
  }>();

  function fmt(val: bigint, dec = 18) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  function handleWithdraw() {
    if (!withdrawAmt) return;
    dispatch('withdraw', { amount: withdrawAmt });
    withdrawAmt = '';
  }
</script>

<div class="space-y-5">

  <!-- Income Breakdown -->
  <div class="card p-5">
    <h3 class="mb-4 font-bold gold-text">Income Breakdown</h3>
    {#each [
      { label:'Daily ROI',       val: income.totalRoi,      c:'#22c55e' },
      { label:'Direct Referral', val: income.totalReferral, c:'#3b82f6' },
      { label:'Level Income',    val: income.totalLevel,    c:'#f59e0b' },
      { label:'Rank Rewards',    val: income.totalSalary,   c:'#a78bfa' },
    ] as row}
      <div class="mb-2 flex items-center justify-between rounded-xl px-4 py-3"
           style="background:var(--color-surface-3)">
        <span class="text-sm text-text-secondary">{row.label}</span>
        <span class="font-bold" style="color:{row.c}">${fmt(row.val)}</span>
      </div>
    {/each}
    <div class="mt-3 flex items-center justify-between rounded-xl border border-border px-4 py-3"
         style="background:var(--color-surface-4)">
      <span class="font-semibold text-text-primary">Total Earnings</span>
      <span class="font-bold gold-text">
        ${fmt(income.totalRoi + income.totalReferral + income.totalLevel + income.totalSalary)}
      </span>
    </div>
  </div>

  {#if !readonly}
  <!-- Claim ROI -->
  <div class="card p-5">
    <h3 class="mb-3 font-bold text-text-primary">Claim ROI to Balance</h3>
    <p class="mb-3 text-sm text-text-muted">
      Moves your pending ROI earnings to your withdrawable balance.
    </p>
    <button on:click={() => dispatch('claimROI')} disabled={txLoading}
            class="btn-primary w-full py-2.5">
      {txLoading ? 'Processing…' : 'Claim ROI'}
    </button>
  </div>

  <!-- Rewards -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold text-text-primary">Rewards</h3>
    <p class="mb-3 text-xs text-text-muted">
      Rewards: <span class="font-bold" style="color:#a78bfa">${fmt(income.totalSalary)}</span>
      earned total. Use Check Rank to qualify for new reward tier.
    </p>
    <div class="flex gap-3">
      <button on:click={() => dispatch('checkRank')} disabled={txLoading}
              class="btn-outline flex-1 py-2.5 text-sm">
        Check Rank
      </button>
      <button on:click={() => dispatch('claimSalary')} disabled={txLoading}
              class="btn-primary flex-1 py-2.5 text-sm">
        Claim Rewards
      </button>
    </div>
  </div>

  <!-- Withdraw -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold text-text-primary">Withdraw</h3>
    <p class="mb-3 text-sm text-text-muted">
      Available: <span class="font-bold gold-text">${fmt(income.availableBal)}</span>
    </p>
    <div class="flex gap-3">
      <input
        type="number"
        bind:value={withdrawAmt}
        placeholder="Enter amount (USDT)"
        class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary
               outline-none focus:border-gold transition-colors"
        style="background:var(--color-surface-3)"
      />
      <button on:click={handleWithdraw} disabled={txLoading || !withdrawAmt}
              class="btn-primary px-5 py-2.5">
        {txLoading ? '…' : 'Send'}
      </button>
    </div>
    <div class="mt-2 flex justify-end">
      <button class="text-xs text-text-muted underline"
              on:click={() => { withdrawAmt = (Number(formatUnits(income.availableBal, 18))).toFixed(2); }}>
        Max
      </button>
    </div>
  </div>
  {/if}

</div>
