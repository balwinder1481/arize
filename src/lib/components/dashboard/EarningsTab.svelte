<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatUnits } from 'viem';
  import type { IncomeData } from '$lib/types/dashboard';

  export let income: IncomeData;
  export let txLoading  = false;
  export let readonly   = false;
  export let withdrawFee = 0;  // bps e.g. 1000 = 10%

  let withdrawAmt = '';

  const dispatch = createEventDispatcher<{
    checkRank:   void;
    claimSalary: void;
    withdraw:    { amount: string };
  }>();

  function fmt(val: bigint | null | undefined, dec = 18) {
    if (val === null || val === undefined) return '0.00';
    try {
      return Number(formatUnits(val, dec)).toLocaleString('en-US', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      });
    } catch {
      return '0.00';
    }
  }

  function handleWithdraw() {
    console.log('DEBUG EarningsTab withdrawAmt:', withdrawAmt, typeof withdrawAmt);
    if (!withdrawAmt || !/^[0-9]*\.?[0-9]+$/.test(withdrawAmt)) {
      alert('Please enter a valid amount');
      return;
    }
    const num = parseFloat(withdrawAmt);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a positive amount');
      return;
    }
    console.log('DEBUG EarningsTab dispatching:', withdrawAmt);
    dispatch('withdraw', { amount: String(withdrawAmt) });
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
    <div class="mt-2 flex items-center justify-between">
      <div class="text-xs text-text-muted">
        {#if withdrawFee > 0 && withdrawAmt}
          Fee: <span class="text-amber-400">{(withdrawFee / 100).toFixed(1)}%</span>
          &nbsp;→&nbsp;You receive:
          <span class="font-bold" style="color:#22c55e">
            ${(parseFloat(withdrawAmt) * (1 - withdrawFee / 10000)).toFixed(2)} USDT
          </span>
        {:else if withdrawFee > 0}
          Withdrawal fee: <span class="text-amber-400">{(withdrawFee / 100).toFixed(1)}%</span>
        {/if}
      </div>
      <button class="text-xs text-text-muted underline"
              on:click={() => { 
                if (!income.availableBal) return;
                withdrawAmt = (Number(formatUnits(income.availableBal, 18))).toFixed(2); 
              }}>
        Max
      </button>
    </div>
  </div>
  {/if}

</div>
