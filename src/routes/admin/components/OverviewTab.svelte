<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { readContract, writeContractWithGas, waitForTransactionReceipt } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { arizeBizV2Abi, usdtAbi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits, parseUnits } from 'viem';
  import QRCode from 'qrcode';
  import { toast } from 'svelte-sonner';

  const dispatch = createEventDispatcher<{ refresh: void }>();
  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;
  const USDT  = env.contracts.usdt as `0x${string}`;

  // ── State ─────────────────────────────────────────────────
  let loading   = true;
  let error     = '';
  let busy      = false;

  let totalUsers             = 0;
  let totalInvested          = 0n;
  let totalWithdrawn         = 0n;
  let contractBal            = 0n;
  let totalAvailableBalance  = 0n;
  let dRoiPer                = 0;
  let minInvest              = 0n;
  let minWithdraw            = 0n;
  let withdrawFee            = 0;
  let workingMult            = 4;
  let roiMult                = 2;
  let dayLength              = 86400;
  let directRefPer           = 0;
  let powerLegPct            = 40;
  let weakerLegPct           = 30;

  // ── Tx History ──────────────────────────────────────────
  const TX_PAGE = 20;
  const TX_TYPES = ['Invest','Referral','Level','ROI','Salary','Withdraw'];
  const TX_COLORS = ['#f59e0b','#3b82f6','#a78bfa','#22c55e','#e879f9','#ef4444'];
  type TxRow = { amount: bigint; from: number; to: number; time: number; txType: number; };
  let txUidInput  = '';
  let txUid       = 0;
  let txTotal     = 0;
  let txPage      = 0;
  let txRows: TxRow[] = [];
  let txLoading   = false;
  let txError     = '';

  async function loadTxPage(uid: number, page: number) {
    txLoading = true; txError = '';
    try {
      const wc = getWagmiConfig()!;
      const total = await readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'getTxCount', args: [uid] }) as bigint;
      txTotal = Number(total);
      const lastPage = Math.max(0, Math.ceil(txTotal / TX_PAGE) - 1);
      const pg = Math.min(page, lastPage);
      txPage = pg;
      const offset = BigInt(Math.max(0, txTotal - (pg + 1) * TX_PAGE));
      const limit  = BigInt(Math.min(TX_PAGE, txTotal - Number(offset)));
      if (limit <= 0n) { txRows = []; txLoading = false; return; }
      const raw = await readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'getTxHistory', args: [uid, offset, limit] }) as TxRow[];
      txRows = [...raw].reverse();
    } catch (e: unknown) { txError = e instanceof Error ? e.message : 'Failed'; }
    finally { txLoading = false; }
  }

  async function searchTx() {
    const uid = parseInt(txUidInput);
    if (!uid || uid <= 0) { txError = 'Enter a valid user ID'; return; }
    txUid = uid;
    await loadTxPage(uid, 0);
  }

  function fmtTime(ts: number) {
    return new Date(ts * 1000).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  }

  // UI toggles
  let showDepositQR   = false;
  let showWithdraw    = false;
  let ewConfirm       = false;
  let ewReceiver      = '';
  let ewAmount        = '';
  let depositAmt      = '';
  function renderQR(node: HTMLCanvasElement) {
    void QRCode.toCanvas(node, PROXY, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } });
  }

  // ── Computed ──────────────────────────────────────────────
  $: isSolvent      = contractBal >= totalAvailableBalance;
  $: surplus        = isSolvent ? contractBal - totalAvailableBalance : 0n;
  $: deficit        = isSolvent ? 0n : totalAvailableBalance - contractBal;
  $: safeWithdraw   = surplus;

  // ── Helpers ───────────────────────────────────────────────
  function fmt(val: bigint | null | undefined) {
    if (val === null || val === undefined) return '0.00';
    try {
      return Number(formatUnits(val, 18)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return '0.00';
    }
  }
  function tx(msg: string, err = false) { if (err) toast.error(msg); else toast.info(msg); }
  function shortAddr(a: string) { return a.slice(0, 6) + '…' + a.slice(-4); }

  // ── Load data ─────────────────────────────────────────────
  export async function load() {
    loading = true; error = '';
    try {
      const wc = getWagmiConfig()!;
      const [tu, ti, tw, tab, dR, mi, mw, wf, wm, rm, dl, dr, pl, wl] = await Promise.all([
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'totalUsers',             args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'totalInvested',          args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'totalWithdrawn',         args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'totalAvailableBalance',  args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'dRoiPer',                args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'minInvest',              args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'minWithdraw',            args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'withdrawFee',            args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'workingMultiplier',      args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'roiMultiplier',          args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'dayLength',              args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'directRefPer',           args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'powerLegPct',            args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'weakerLegPct',           args: [] }),
      ]);
      let cb = 0n;
      try {
        cb = await readContract(wc, { address: USDT, abi: usdtAbi, functionName: 'balanceOf', args: [PROXY] }) as unknown as bigint;
      } catch { /* ignore */ }

      totalUsers            = Number(tu);
      totalInvested         = ti  as unknown as bigint;
      totalWithdrawn        = tw  as unknown as bigint;
      totalAvailableBalance = tab as unknown as bigint;
      contractBal           = cb;
      dRoiPer               = Number(dR);
      minInvest             = mi  as unknown as bigint;
      minWithdraw           = mw  as unknown as bigint;
      withdrawFee           = Number(wf);
      workingMult           = Number(wm);
      roiMult               = Number(rm);
      dayLength             = Number(dl);
      directRefPer          = Number(dr);
      powerLegPct           = Number(pl);
      weakerLegPct          = Number(wl);
    } catch (e: unknown) { error = e instanceof Error ? e.message : 'Load failed'; }
    finally { loading = false; }
  }

  // ── Actions ───────────────────────────────────────────────
  async function adminDeposit() {
    if (!depositAmt) return;
    busy = true;
    const id = toast.loading('Approving USDT…');
    try {
      const amt = parseUnits(String(depositAmt), 18);
      const appTx = await writeContractWithGas({ address: USDT, abi: usdtAbi, functionName: 'approve', args: [PROXY, amt] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: appTx });
      toast.loading('Depositing…', { id });
      const dtx = await writeContractWithGas({ address: PROXY, abi: arizeBizV2Abi, functionName: 'adminDeposit', args: [amt] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: dtx });
      toast.success('Deposit successful ✓', { id });
      depositAmt = ''; showDepositQR = false;
      dispatch('refresh'); load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Deposit failed', { id }); }
    finally { busy = false; }
  }

  async function emergencyWithdraw() {
    if (!ewReceiver || !ewAmount) { toast.error('Enter receiver and amount'); return; }
    if (!ewConfirm) { ewConfirm = true; return; }
    ewConfirm = false;
    busy = true;
    const id = toast.loading('Processing withdrawal…');
    try {
      const etx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'emergencyWithdraw',
        args: [ewReceiver as `0x${string}`, parseUnits(String(ewAmount), 18)],
      });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: etx });
      toast.success('Withdrawal successful ✓', { id });
      ewReceiver = ewAmount = ''; showWithdraw = false;
      dispatch('refresh'); load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Withdrawal failed', { id }); }
    finally { busy = false; }
  }

  onMount(async () => { await initWeb3(); load(); });
</script>

<div class="space-y-6">

  {#if loading}
    <div class="flex h-48 items-center justify-center">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
    </div>
  {:else if error}
    <div class="card p-6 text-center text-error">{error}
      <button on:click={load} class="btn-outline mt-3 px-4 py-2 text-sm">Retry</button>
    </div>
  {:else}

  <!-- Header -->
  <div class="flex items-center gap-3">
    <svg class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
    <h2 class="text-xl font-bold text-text-primary">Contract Analytics</h2>
    <button on:click={load} class="ml-auto btn-outline px-3 py-1.5 text-xs">↻ Refresh</button>
  </div>

  <!-- Key Metrics -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {#each [
      { label: 'Total Invested',   val: `$${fmt(totalInvested)}`,  color: '#00FFE7' },
      { label: 'Total Withdrawn',  val: `$${fmt(totalWithdrawn)}`, color: '#FF8C42' },
      { label: 'Contract Balance', val: `$${fmt(contractBal)}`,    color: '#36FF6F' },
      { label: 'Total Users',      val: totalUsers.toLocaleString(), color: '#f59e0b' },
    ] as m}
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold" style="color:{m.color}">{m.val}</div>
        <div class="mt-1 text-xs text-text-muted">{m.label}</div>
      </div>
    {/each}
  </div>

  <!-- Contract Health -->
  <div class="card p-5" style="border-color:{isSolvent ? 'rgba(54,255,111,0.3)' : 'rgba(255,88,51,0.5)'}">
    <h3 class="mb-4 text-lg font-bold text-text-primary">Solvency Check</h3>
    <!-- Two primary numbers -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="rounded-xl p-4 text-center" style="background:var(--color-surface-3)">
        <p class="text-xs text-text-muted mb-1">Contract Balance</p>
        <p class="text-2xl font-bold" style="color:#36FF6F">${fmt(contractBal)}</p>
        <p class="mt-1 text-xs" style="color:#36FF6F66">Actual USDT held</p>
      </div>
      <div class="rounded-xl p-4 text-center" style="background:var(--color-surface-3)">
        <p class="text-xs text-text-muted mb-1">Total Withdrawable</p>
        <p class="text-2xl font-bold" style="color:#FF8C42">${fmt(totalAvailableBalance)}</p>
        <p class="mt-1 text-xs" style="color:#FF8C4266">Owed to all users</p>
      </div>
    </div>
    <!-- Surplus / Deficit -->
    <div class="rounded-xl p-3 text-center mb-4"
         style="background:{isSolvent ? 'rgba(54,255,111,0.08)' : 'rgba(255,88,51,0.08)'}; border:1px solid {isSolvent ? 'rgba(54,255,111,0.25)' : 'rgba(255,88,51,0.4)'}">
      <p class="text-xs text-text-muted mb-1">{isSolvent ? 'Surplus (Safe to Withdraw)' : 'DEFICIT'}</p>
      <p class="text-3xl font-bold" style="color:{isSolvent ? '#00FFE7' : '#FF5833'}">
        {isSolvent ? '+' : '−'}${fmt(isSolvent ? surplus : deficit)}
      </p>
      <p class="mt-2 text-sm font-bold" style="color:{isSolvent ? '#36FF6F' : '#FF5833'}">
        {isSolvent ? '✓ Solvent' : '⚠️ INSOLVENT — Top up required!'}
      </p>
    </div>

    <!-- Deposit -->
    <div class="mt-5 border-t border-border pt-4">
      <h4 class="mb-3 text-sm font-bold text-text-primary">Admin Deposit USDT</h4>
      {#if !showDepositQR}
        <button on:click={() => showDepositQR = true}
                class="w-full rounded-xl py-2.5 text-sm font-bold text-black transition-all hover:opacity-90"
                style="background:linear-gradient(135deg,#36FF6F,#00FFE7)">
          Show Deposit QR / Manual Deposit
        </button>
      {:else}
        <div class="space-y-3 rounded-xl border border-border p-4" style="background:var(--color-surface-3)">
          <div class="flex flex-col items-center gap-2">
            <canvas use:renderQR class="rounded-xl"></canvas>
            <p class="text-xs text-text-muted">Contract Address (BEP-20 USDT)</p>
            <p class="break-all text-center font-mono text-xs text-amber-400">{PROXY}</p>
          </div>
          <div class="flex gap-2">
            <input bind:value={depositAmt} type="number" placeholder="Amount in USDT"
                   class="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none"
                   style="background:var(--color-surface-2); color:var(--color-text-primary)" />
            <button on:click={adminDeposit} disabled={busy || !depositAmt}
                    class="rounded-xl px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                    style="background:linear-gradient(135deg,#36FF6F,#00FFE7)">
              {busy ? '…' : 'Deposit'}
            </button>
          </div>
          <button on:click={() => showDepositQR = false} class="w-full btn-outline py-2 text-xs">Hide</button>
        </div>
      {/if}
    </div>

    <!-- Emergency Withdraw -->
    <div class="mt-5 border-t border-border pt-4">
      <h4 class="mb-3 text-sm font-bold" style="color:#FF8C42">⚠ Emergency Withdraw USDT</h4>
      {#if !showWithdraw}
        <button on:click={() => showWithdraw = true}
                class="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
                style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
          Withdraw Funds
        </button>
      {:else}
        <div class="space-y-3">
          <div class="rounded-xl border px-3 py-2 text-xs" style="border-color:rgba(255,140,66,0.3);background:rgba(255,140,66,0.05)">
            <span class="text-text-muted">Safe amount:</span>
            <span class="ml-2 font-bold" style="color:#00FFE7">${fmt(safeWithdraw)}</span>
          </div>
          <input bind:value={ewReceiver} type="text" placeholder="Receiver address (0x…)"
                 class="w-full rounded-xl border border-border px-3 py-2 font-mono text-xs outline-none"
                 style="background:var(--color-surface-2); color:var(--color-text-primary)" />
          <div class="flex gap-2">
            <input bind:value={ewAmount} type="number" placeholder="USDT amount"
                   class="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none"
                   style="background:var(--color-surface-2); color:var(--color-text-primary)" />
            <button on:click={emergencyWithdraw} disabled={busy || !ewAmount || !ewReceiver}
                    class="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    style="background:#dc2626">
              {busy ? '…' : ewConfirm ? '⚠ Confirm' : 'Withdraw'}
            </button>
          </div>

          {#if ewConfirm}
            <div class="rounded-xl border p-3 text-xs" style="border-color:rgba(220,38,38,0.4);background:rgba(220,38,38,0.08)">
              <p class="mb-1 font-bold text-red-400">⚠ Are you sure?</p>
              <p class="text-text-muted">Withdraw <span class="font-bold text-white">${ewAmount} USDT</span> to</p>
              <p class="mt-0.5 break-all font-mono text-text-muted">{ewReceiver}</p>
              <p class="mt-1 text-text-muted">Safe amount: <span class="font-bold" style="color:#00FFE7">${fmt(safeWithdraw)}</span></p>
              <div class="mt-3 flex gap-2">
                <button on:click={emergencyWithdraw} disabled={busy}
                        class="flex-1 rounded-xl py-2 text-sm font-bold text-white disabled:opacity-50"
                        style="background:#dc2626">
                  {busy ? 'Processing…' : 'Yes, Withdraw'}
                </button>
                <button on:click={() => ewConfirm = false}
                        class="flex-1 rounded-xl border border-border py-2 text-sm text-text-muted hover:text-text-primary">
                  Cancel
                </button>
              </div>
            </div>
          {/if}

          <button on:click={() => { showWithdraw = false; ewConfirm = false; }} class="w-full btn-outline py-2 text-xs">Close</button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Contract Parameters -->
  <div class="card p-5">
    <h3 class="mb-4 text-lg font-bold text-text-primary flex items-center gap-2">
      <svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
      Contract Parameters
    </h3>
    <div class="grid grid-cols-2 gap-2.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
      {#each [
        { k: 'Daily ROI',        v: `${dRoiPer/100}%  (${dRoiPer} bps)` },
        { k: 'Direct Ref %',     v: `${directRefPer/100}%  (${directRefPer} bps)` },
        { k: 'Min Invest',       v: `$${fmt(minInvest)}` },
        { k: 'Min Withdraw',     v: `$${fmt(minWithdraw)}` },
        { k: 'Withdraw Fee',     v: `${withdrawFee/100}%  (${withdrawFee} bps)` },
        { k: 'Working Cap',      v: `${workingMult}× total` },
        { k: 'ROI Cap',          v: `${roiMult}× ROI` },
        { k: 'Day Length',       v: `${dayLength}s (${(dayLength/3600).toFixed(1)}h)` },
        { k: 'Leg Weights',      v: `${powerLegPct}% / ${weakerLegPct}% / ${100-powerLegPct-weakerLegPct}%` },
      ] as p}
        <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
          <div class="text-xs text-text-muted">{p.k}</div>
          <div class="mt-0.5 font-semibold text-text-primary">{p.v}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Recent Transactions -->
  <div class="card p-5">
    <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
      <svg class="h-5 w-5" style="color:#3b82f6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      Transaction History
    </h3>

    <!-- Search -->
    <div class="mb-4 flex gap-2">
      <input bind:value={txUidInput} on:keydown={e => e.key === 'Enter' && searchTx()}
             type="number" placeholder="Enter User ID (e.g. 1)"
             class="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none"
             style="background:var(--color-surface-3);color:var(--color-text-primary)" />
      <button on:click={searchTx} disabled={txLoading}
              class="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style="background:#3b82f6">
        {txLoading ? '…' : 'Load'}
      </button>
    </div>

    {#if txError}
      <p class="text-sm text-error">{txError}</p>
    {:else if txUid > 0}
      <p class="mb-3 text-xs text-text-muted">
        User AB{txUid} — <span class="font-bold text-text-primary">{txTotal}</span> total transactions
      </p>

      {#if txLoading}
        <div class="flex h-24 items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      {:else if txRows.length === 0}
        <p class="text-sm text-text-muted">No transactions found.</p>
      {:else}
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-border text-left text-text-muted">
                <th class="pb-2 pr-4">#</th>
                <th class="pb-2 pr-4">Type</th>
                <th class="pb-2 pr-4">Amount</th>
                <th class="pb-2 pr-4">From</th>
                <th class="pb-2 pr-4">To</th>
                <th class="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {#each txRows as tx, i}
                <tr class="border-b border-border/40 hover:bg-white/5">
                  <td class="py-2 pr-4 text-text-muted">{txTotal - txPage * TX_PAGE - i}</td>
                  <td class="py-2 pr-4">
                    <span class="rounded-full px-2 py-0.5 text-xs font-bold text-black"
                          style="background:{TX_COLORS[tx.txType] ?? '#888'}">
                      {TX_TYPES[tx.txType] ?? tx.txType}
                    </span>
                  </td>
                  <td class="py-2 pr-4 font-semibold text-text-primary">${Number(formatUnits(tx.amount, 18)).toFixed(2)}</td>
                  <td class="py-2 pr-4 text-text-muted">{tx.from === 0 ? 'Contract' : `AB${tx.from}`}</td>
                  <td class="py-2 pr-4 text-text-muted">{tx.to === 0 ? 'Contract' : `AB${tx.to}`}</td>
                  <td class="py-2 text-text-muted">{fmtTime(tx.time)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if txTotal > TX_PAGE}
          <div class="mt-4 flex items-center justify-between text-xs">
            <button on:click={() => loadTxPage(txUid, txPage + 1)}
                    disabled={txLoading || (txPage + 1) * TX_PAGE >= txTotal}
                    class="rounded-xl border border-border px-3 py-1.5 disabled:opacity-30 hover:border-blue-500">
              ← Older
            </button>
            <span class="text-text-muted">
              Page {txPage + 1} / {Math.ceil(txTotal / TX_PAGE)}
            </span>
            <button on:click={() => loadTxPage(txUid, txPage - 1)}
                    disabled={txLoading || txPage === 0}
                    class="rounded-xl border border-border px-3 py-1.5 disabled:opacity-30 hover:border-blue-500">
              Newer →
            </button>
          </div>
        {/if}
      {/if}
    {:else}
      <p class="text-sm text-text-muted">Enter a User ID above to view their transaction history.</p>
    {/if}
  </div>

  {/if}
</div>
