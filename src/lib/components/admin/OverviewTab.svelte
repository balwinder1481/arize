<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writeContractWithGas, waitForTransactionReceipt, wagmiConfig } from '$lib/web3/store';
  import { arizeBizV2Abi, usdtAbi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits, parseUnits } from 'viem';
  import type { ContractConfig } from '$lib/types/admin';

  export let cfg: ContractConfig;
  export let txLoading = false;

  const dispatch = createEventDispatcher<{ refresh: void; txStatus: { msg: string; err: boolean } }>();
  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;
  const USDT  = env.contracts.usdt as `0x${string}`;

  let depositAmt = '';
  let ewReceiver = '';
  let ewAmount   = '';

  function fmt(val: bigint, dec = 18) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }
  function fmtN(val: number) { return val.toLocaleString(); }

  function tx(msg: string, err = false) { dispatch('txStatus', { msg, err }); }

  async function adminDeposit() {
    if (!depositAmt) return;
    dispatch('txStatus', { msg: 'Approving…', err: false });
    try {
      const amtWei = parseUnits(depositAmt, 18);
      const appTx = await writeContractWithGas({
        address: USDT, abi: usdtAbi, functionName: 'approve', args: [PROXY, amtWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: appTx });
      tx('Depositing…');
      const dtx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'adminDeposit', args: [amtWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: dtx });
      tx('Deposit done! ✓');
      depositAmt = '';
      dispatch('refresh');
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }

  async function emergencyWithdraw() {
    if (!ewReceiver || !ewAmount) { tx('Fill receiver and amount', true); return; }
    if (!confirm(`Withdraw $${ewAmount} to ${ewReceiver}?\nThis affects contract solvency!`)) return;
    tx('Processing emergency withdraw…');
    try {
      const etx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'emergencyWithdraw',
        args: [ewReceiver as `0x${string}`, parseUnits(ewAmount, 18)],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: etx });
      tx('Emergency withdraw done! ✓');
      ewReceiver = ewAmount = '';
      dispatch('refresh');
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }

  // Daily liability estimate = totalInvested * dRoiPer / 10000
  $: dailyLiability = cfg.totalInvested * BigInt(cfg.dRoiPer) / 10000n;
  // Safe to withdraw = contractBal - 30 days of liabilities
  $: safeWithdraw = cfg.contractBal > dailyLiability * 30n
    ? cfg.contractBal - dailyLiability * 30n
    : 0n;
</script>

<div class="space-y-5">

  <!-- Key metrics -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {#each [
      { label:'Total Users',      val: fmtN(cfg.totalUsers),        unit:'',  c:'#f59e0b' },
      { label:'Total Invested',   val: `$${fmt(cfg.totalInvested)}`, unit:'',  c:'#22c55e' },
      { label:'Total Withdrawn',  val: `$${fmt(cfg.totalWithdrawn)}`,unit:'',  c:'#3b82f6' },
      { label:'Contract Balance', val: `$${fmt(cfg.contractBal)}`,   unit:'',  c:'#a78bfa' },
    ] as m}
      <div class="card p-4 text-center">
        <div class="text-xl font-bold" style="color:{m.c}">{m.val}</div>
        <div class="mt-0.5 text-xs text-text-muted">{m.label}</div>
      </div>
    {/each}
  </div>

  <!-- Liability + solvency -->
  <div class="grid gap-3 sm:grid-cols-2">
    <div class="card p-4">
      <div class="text-xs text-text-muted mb-1">Est. Daily Liability</div>
      <div class="text-xl font-bold" style="color:#ef4444">${fmt(dailyLiability)}</div>
      <div class="mt-1 text-xs text-text-muted">Based on {cfg.dRoiPer/100}% daily ROI on invested capital</div>
    </div>
    <div class="card p-4">
      <div class="text-xs text-text-muted mb-1">Safe to Withdraw (30-day buffer)</div>
      <div class="text-xl font-bold" style="color:{safeWithdraw > 0n ? '#22c55e' : '#ef4444'}">
        ${fmt(safeWithdraw)}
      </div>
      <div class="mt-1 text-xs text-text-muted">
        {safeWithdraw > 0n ? 'Contract is solvent' : 'Below safety threshold!'}
      </div>
    </div>
  </div>

  <!-- Contract params -->
  <div class="card p-5">
    <h3 class="mb-4 font-bold gold-text">Contract Parameters</h3>
    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 text-sm">
      {#each [
        { k:'Daily ROI',       v:`${cfg.dRoiPer/100}%  (${cfg.dRoiPer} bps)` },
        { k:'Direct Ref %',    v:`${cfg.directRefPer/100}% (${cfg.directRefPer} bps)` },
        { k:'Min Invest',      v:`$${fmt(cfg.minInvest)}` },
        { k:'Min Withdraw',    v:`$${fmt(cfg.minWithdraw)}` },
        { k:'Withdraw Fee',    v:`${cfg.withdrawFee/100}% (${cfg.withdrawFee} bps)` },
        { k:'Working Mult',    v:`${cfg.workingMult}×` },
        { k:'ROI Multiplier',  v:`${cfg.roiMult}×` },
        { k:'Day Length',      v:`${cfg.dayLength}s (${(cfg.dayLength/3600).toFixed(1)}h)` },
      ] as p}
        <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
          <div class="text-xs text-text-muted">{p.k}</div>
          <div class="mt-0.5 font-semibold text-text-primary">{p.v}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Admin deposit & emergency withdraw -->
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="card p-5">
      <h3 class="mb-1 font-bold text-text-primary">Admin Deposit</h3>
      <p class="mb-3 text-xs text-text-muted">Add USDT liquidity to the contract.</p>
      <div class="flex gap-2">
        <input type="number" bind:value={depositAmt} placeholder="Amount (USDT)"
          class="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
        <button on:click={adminDeposit} disabled={txLoading || !depositAmt}
                class="btn-primary px-4 py-2.5 text-sm whitespace-nowrap">
          Deposit
        </button>
      </div>
    </div>

    <div class="card p-5" style="border-color:rgba(239,68,68,0.3)">
      <h3 class="mb-1 font-bold" style="color:#ef4444">⚠ Emergency Withdraw</h3>
      <p class="mb-3 text-xs text-text-muted">
        Safe amount: <span class="font-bold" style="color:{safeWithdraw > 0n ? '#22c55e' : '#ef4444'}">${fmt(safeWithdraw)}</span>
      </p>
      <div class="flex flex-col gap-2">
        <input type="text" bind:value={ewReceiver} placeholder="Receiver (0x…)"
          class="rounded-xl border border-border px-3 py-2 text-xs text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
        <div class="flex gap-2">
          <input type="number" bind:value={ewAmount} placeholder="USDT amount"
            class="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm text-text-primary outline-none"
            style="background:var(--color-surface-3)" />
          <button on:click={emergencyWithdraw} disabled={txLoading}
                  class="rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                  style="background:#dc2626">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
