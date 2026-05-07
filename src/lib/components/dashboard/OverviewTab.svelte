<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatUnits } from 'viem';
  import { readContract } from '$lib/web3/store';
  import { getWagmiConfig } from '$lib/web3/config';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import type { IncomeData, UserInfo } from '$lib/types/dashboard';

  export let income: IncomeData;
  export let user: UserInfo;
  export let txLoading = false;
  export let readonly   = false;

  const dispatch = createEventDispatcher<{ claimROI: void; refresh: void }>();
  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  function fmt(val: bigint, dec = 18) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  $: totalEarned = income.totalRoi + income.totalReferral + income.totalLevel + income.totalSalary;

  // ── Tx History ──────────────────────────────────────────────
  const TX_PAGE  = 10;
  const TX_TYPES  = ['Invest','Referral','Level','ROI','Rank','Withdraw'];
  const TX_COLORS = ['#f59e0b','#3b82f6','#a78bfa','#22c55e','#e879f9','#ef4444'];
  type TxRow = { amount: bigint; from: number; to: number; time: number; txType: number; };

  let txTotal   = 0;
  let txPage    = 0;
  let txRows: TxRow[] = [];
  let txBusy    = false;
  let txErr     = '';

  async function loadTxPage(page: number) {
    const uid = Number(user.userId);
    if (!uid) return;
    txBusy = true; txErr = '';
    try {
      const wc = getWagmiConfig()!;
      if (!txTotal) {
        const total = await readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'getTxCount', args: [uid] }) as bigint;
        txTotal = Number(total);
      }
      const lastPage = Math.max(0, Math.ceil(txTotal / TX_PAGE) - 1);
      const pg = Math.min(page, lastPage);
      txPage = pg;
      const offset = BigInt(Math.max(0, txTotal - (pg + 1) * TX_PAGE));
      const limit  = BigInt(Math.min(TX_PAGE, txTotal - Number(offset)));
      if (limit <= 0n) { txRows = []; txBusy = false; return; }
      const raw = await readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'getTxHistory', args: [uid, offset, limit] }) as TxRow[];
      txRows = [...raw].reverse();
    } catch (e: unknown) { txErr = e instanceof Error ? e.message : 'Failed to load'; }
    finally { txBusy = false; }
  }

  function fmtTime(ts: number) {
    return new Date(ts * 1000).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  }

  $: if (user.userId) loadTxPage(0);
</script>

<div class="space-y-5">
  <!-- Claim ROI card -->
  <div class="card p-6"
       style="border-color:var(--color-border-strong);box-shadow:0 0 24px var(--color-gold-glow)">
    <div class="mb-1 text-xs text-text-muted uppercase tracking-wide">Available Balance</div>
    <div class="mb-1 text-4xl font-bold gold-text">${fmt(income.availableBal)}</div>
    <p class="mb-4 text-xs text-text-muted">Ready to withdraw · includes all income types</p>
    {#if !readonly}
    <button on:click={() => dispatch('claimROI')} disabled={txLoading}
            class="btn-primary w-full py-3">
      {txLoading ? 'Processing…' : 'Claim ROI'}
    </button>
    {/if}
  </div>

  <!-- Stats grid -->
  <div class="grid gap-4 sm:grid-cols-2">
    {#each [
      { label:'Total Invested',   val: user.totalInvested,  c:'#f59e0b' },
      { label:'Total Earned',     val: totalEarned,         c:'#22c55e' },
      { label:'Total Withdrawn',  val: income.totalWithdrawn, c:'#3b82f6' },
      { label:'Net Balance',      val: totalEarned - income.totalWithdrawn, c:'#a78bfa' },
    ] as s}
      <div class="card p-5">
        <div class="text-xs text-text-muted mb-1">{s.label}</div>
        <div class="text-2xl font-bold" style="color:{s.c}">${fmt(s.val)}</div>
      </div>
    {/each}
  </div>

  <!-- Income type breakdown (mini) -->
  <div class="card p-5">
    <h3 class="mb-3 text-sm font-bold text-text-secondary uppercase tracking-wide">Income Breakdown</h3>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {#each [
        { label:'Daily ROI',    val: income.totalRoi,      c:'#22c55e' },
        { label:'Referral',     val: income.totalReferral, c:'#3b82f6' },
        { label:'Level',        val: income.totalLevel,    c:'#f59e0b' },
        { label:'Rank Reward',  val: income.totalSalary,   c:'#a78bfa' },
      ] as s}
        <div class="rounded-xl px-3 py-2.5 text-center" style="background:var(--color-surface-3)">
          <div class="text-base font-bold" style="color:{s.c}">${fmt(s.val)}</div>
          <div class="mt-0.5 text-xs text-text-muted">{s.label}</div>
        </div>
      {/each}
    </div>
  </div>

</div>

<!-- Transaction History -->
<div class="card p-5 mt-5">
  <h3 class="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-text-secondary">
    <svg class="h-4 w-4" style="color:#3b82f6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
    Transaction History
    <span class="ml-auto text-xs font-normal text-text-muted normal-case">{txTotal} total</span>
  </h3>

  {#if txErr}
    <p class="text-sm text-error">{txErr}</p>
  {:else if txBusy && txRows.length === 0}
    <div class="flex h-20 items-center justify-center">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
    </div>
  {:else if txRows.length === 0}
    <p class="text-sm text-text-muted">No transactions yet.</p>
  {:else}
    <div class="space-y-2">
      {#each txRows as tx}
        <div class="rounded-xl px-3 py-2.5 text-sm" style="background:var(--color-surface-3)">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="rounded-full px-2 py-0.5 text-xs font-bold text-black"
                    style="background:{TX_COLORS[tx.txType] ?? '#888'}">
                {TX_TYPES[tx.txType] ?? '?'}
              </span>
              <span class="text-xs text-text-muted">{fmtTime(tx.time)}</span>
            </div>
            <span class="font-bold" style="color:{TX_COLORS[tx.txType] ?? '#fff'}">
              {tx.txType === 5 ? '-' : '+'} ${Number(formatUnits(tx.amount, 18)).toFixed(2)}
            </span>
          </div>
          <div class="mt-1 text-xs text-text-muted">
            {#if tx.txType === 0}
              <span>Invested by <span class="font-medium text-text-secondary">AB{tx.from}</span></span>
            {:else if tx.txType === 1}
              <span>Referral from <span class="font-medium text-text-secondary">AB{tx.from}</span></span>
            {:else if tx.txType === 2}
              <span>Level income from <span class="font-medium text-text-secondary">AB{tx.from}</span></span>
            {:else if tx.txType === 3}
              <span>ROI credited by system</span>
            {:else if tx.txType === 4}
              <span>Rank reward credited by system</span>
            {:else if tx.txType === 5}
              <span>Withdrawn to wallet</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if txTotal > TX_PAGE}
      <div class="mt-4 flex items-center justify-between text-xs">
        <button on:click={() => loadTxPage(txPage + 1)}
                disabled={txBusy || (txPage + 1) * TX_PAGE >= txTotal}
                class="rounded-xl border border-border px-3 py-1.5 disabled:opacity-30 hover:border-blue-500">
          ← Older
        </button>
        <span class="text-text-muted">Page {txPage + 1} / {Math.ceil(txTotal / TX_PAGE)}</span>
        <button on:click={() => loadTxPage(txPage - 1)}
                disabled={txBusy || txPage === 0}
                class="rounded-xl border border-border px-3 py-1.5 disabled:opacity-30 hover:border-blue-500">
          Newer →
        </button>
      </div>
    {/if}
  {/if}
</div>
