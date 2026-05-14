<script lang="ts">
  import { onMount } from 'svelte';
  import { readContract, writeContractWithGas, waitForTransactionReceipt } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits } from 'viem';
  import { toast } from 'svelte-sonner';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  // ── Config state ──────────────────────────────────────────
  let cfg = {
    dRoiPer: 0, directRefPer: 0, withdrawFee: 0,
    minInvest: 0n, maxInvest: 0n, investMultiple: 0n,
    minWithdraw: 0n, workingMult: 4, roiMult: 2,
    dayLength: 86400, feeReceiver: '', firstUser: '',
    powerLegPct: 40, weakerLegPct: 30, weakestLegPct: 30,
    bonanzaCount: 0,
  };
  let loading = true;

  // ── Edit state ────────────────────────────────────────────
  let editField: string | null = null;
  let editVal   = '';
  let timeUnit: 'days' | 'hours' | 'minutes' | 'seconds' = 'days';
  let busy      = false;

  // ── Bonanza create form ───────────────────────────────────
  let bnName  = '';
  let bnStart = '';
  let bnEnd   = '';
  interface Tier { direct: string; team: string; reward: string; }
  let bnTiers: Tier[] = [{ direct: '', team: '', reward: '' }];
  let bnBusy  = false;

  // ── Leg % form ────────────────────────────────────────────
  let legPower   = '';
  let legWeaker  = '';
  let legWeakest = '';
  let legBusy    = false;

  // ── Rank config form ──────────────────────────────────────
  let rankTargets: (string | number)[] = Array(10).fill('');
  let rankPerDay: (string | number)[] = Array(10).fill('');
  let rankBusy = false;

  function focus(node: HTMLElement) { node.focus(); }

  // ── Helpers ───────────────────────────────────────────────
  function fmt(v: bigint) { return '$' + Number(formatUnits(v, 18)).toFixed(2); }
  function setStatus(msg: string, err = false) { if (err) toast.error(msg); else toast.success(msg); }

  let currentRankTargets: bigint[] = [];
  let currentRankPerDay: bigint[] = [];

  async function loadConfig() {
    loading = true;
    try {
      const wc = getWagmiConfig()!;
      
      // Load rank config
      try {
        const rankCfg = await readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'getRankConfig' }) as unknown as [bigint[], bigint[]];
        currentRankTargets = rankCfg[0];
        currentRankPerDay = rankCfg[1];
      } catch { /* ignore */ }
      
      const [dR, dr, wf, mi, ma, mul, mw, wm, rm, dl, fr, fu, pl, wl, wst, bc] = await Promise.all([
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'dRoiPer' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'directRefPer' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'withdrawFee' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'minInvest' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'maxInvest' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'investMultiple' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'minWithdraw' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'workingMultiplier' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'roiMultiplier' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'dayLength' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'withdrawalFeeReceiver' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'owner' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'powerLegPct' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'weakerLegPct' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'weakestLegPct' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'bonanzaCount' }),
      ]);
      cfg = {
        dRoiPer: Number(dR), directRefPer: Number(dr), withdrawFee: Number(wf),
        minInvest: mi as unknown as bigint, maxInvest: ma as unknown as bigint,
        investMultiple: mul as unknown as bigint, minWithdraw: mw as unknown as bigint,
        workingMult: Number(wm), roiMult: Number(rm), dayLength: Number(dl),
        feeReceiver: fr as string, firstUser: fu as string,
        powerLegPct: Number(pl), weakerLegPct: Number(wl), weakestLegPct: Number(wst),
        bonanzaCount: Number(bc),
      };
    } catch { /* ignore */ }
    loading = false;
  }

  // ── Generic setter ────────────────────────────────────────
  async function doSave(fn: string, args: unknown[]) {
    busy = true;
    const id = toast.loading('Updating…');
    try {
      const tx = await writeContractWithGas({ address: PROXY, abi: arizeBizV2Abi, functionName: fn as never, args } as never);
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('Updated successfully ✓', { id });
      editField = null; editVal = '';
      await loadConfig();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed', { id }); }
    finally { busy = false; }
  }

  // ── Rank config setter ────────────────────────────────────
  async function updateRank(level: number) {
    if (!rankTargets[level] || !rankPerDay[level]) return;
    rankBusy = true;
    const id = toast.loading(`Updating Rank ${level + 1}…`);
    try {
      const { parseUnits } = await import('viem');
      const target = parseUnits(String(rankTargets[level]), 18);
      const perDay = parseUnits(String(rankPerDay[level]), 18);
      
      await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'setRankConfig', args: [level, target, perDay],
      });
      
      toast.success(`Rank ${level + 1} updated! ✓`, { id });
      rankTargets[level] = '';
      rankPerDay[level] = '';
      await loadConfig();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed', { id }); }
    finally { rankBusy = false; }
  }

  function toSeconds(v: string) {
    const n = parseFloat(v);
    const m = timeUnit === 'days' ? 86400 : timeUnit === 'hours' ? 3600 : timeUnit === 'minutes' ? 60 : 1;
    return BigInt(Math.floor(n * m));
  }

  const handlers: Record<string, () => void> = {
    dRoiPer:       () => doSave('setDailyRoi',         [BigInt(Math.round(parseFloat(editVal) * 100))]),
    directRefPer:  () => doSave('setDirectRefPer',     [BigInt(Math.round(parseFloat(editVal) * 100))]),
    withdrawFee:   () => doSave('setWithdrawFee',      [BigInt(Math.round(parseFloat(editVal) * 100))]),
    minInvest:     () => doSave('setMinInvest',        [BigInt(Math.floor(parseFloat(editVal) * 1e18))]),
    maxInvest:     () => doSave('setMaxInvest',        [BigInt(Math.floor(parseFloat(editVal) * 1e18))]),
    investMultiple:() => doSave('setInvestMultiple',   [BigInt(Math.floor(parseFloat(editVal) * 1e18))]),
    minWithdraw:   () => doSave('setMinWithdraw',      [BigInt(Math.floor(parseFloat(editVal) * 1e18))]),
    workingMult:   () => doSave('setWorkingMultiplier',[BigInt(editVal)]),
    roiMult:       () => doSave('setRoiMultiplier',    [BigInt(editVal)]),
    dayLength:     () => doSave('setDayLength',        [toSeconds(editVal)]),
    feeReceiver:   () => doSave('setFeeReceiver',      [editVal as `0x${string}`]),
    firstUser:     () => doSave('setOwner',            [editVal as `0x${string}`]),
  };

  // ── Bonanza create ────────────────────────────────────────
  function addTier() { bnTiers = [...bnTiers, { direct: '', team: '', reward: '' }]; }
  function removeTier(i: number) { if (bnTiers.length > 1) bnTiers = bnTiers.filter((_, j) => j !== i); }
  function updateTier(i: number, field: keyof Tier, v: string) {
    const t = [...bnTiers]; t[i][field] = v; bnTiers = t;
  }

  async function createBonanza() {
    if (!bnName.trim() || !bnStart || !bnEnd) { toast.error('Fill name and dates'); return; }
    if (bnTiers.some(t => !t.direct || !t.team || !t.reward)) { toast.error('Fill all tier fields'); return; }
    bnBusy = true;
    const bnId = toast.loading('Creating bonanza…');
    try {
      const st = Math.floor(new Date(bnStart).getTime() / 1000);
      const et = Math.floor(new Date(bnEnd).getTime()   / 1000);
      const directs  = bnTiers.map(t => BigInt(Math.floor(parseFloat(t.direct) * 1e18)));
      const teams    = bnTiers.map(t => BigInt(Math.floor(parseFloat(t.team)   * 1e18)));
      const rewards  = bnTiers.map(t => BigInt(Math.floor(parseFloat(t.reward) * 1e18)));
      const tx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'createBonanza',
        args: [bnName, st, et, directs, teams, rewards],
      });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success(`Bonanza "${bnName}" created! ✓`, { id: bnId });
      bnName = bnStart = bnEnd = '';
      bnTiers = [{ direct: '', team: '', reward: '' }];
      await loadConfig();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed', { id: bnId }); }
    finally { bnBusy = false; }
  }

  async function updateLegs() {
    const p = parseInt(legPower), w = parseInt(legWeaker), ws = parseInt(legWeakest);
    if (p + w + ws !== 100) { toast.error('Leg percentages must sum to 100'); return; }
    legBusy = true;
    const legId = toast.loading('Updating leg percentages…');
    try {
      const tx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'updateLegPercentages',
        args: [p, w, ws],
      });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('Leg percentages updated ✓', { id: legId });
      legPower = legWeaker = legWeakest = '';
      await loadConfig();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed', { id: legId }); }
    finally { legBusy = false; }
  }

  onMount(async () => { await initWeb3(); loadConfig(); });
</script>

<div class="space-y-8">

  <!-- Header -->
  <div class="flex items-center gap-3">
    <svg class="h-6 w-6" style="color:#1762FF" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
    </svg>
    <h2 class="text-xl font-bold text-text-primary">Contract Configuration</h2>
    <button on:click={loadConfig} class="ml-auto btn-outline px-3 py-1.5 text-xs">↻ Refresh</button>
  </div>

  {#if loading}
    <div class="flex h-32 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
    </div>
  {:else}

  <!-- SECTION 1: Admin Settings -->
  <section>
    <div class="mb-4 flex items-center gap-2">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-black" style="background:linear-gradient(135deg,#00FFE7,#1762FF)">1</span>
      <h3 class="text-lg font-bold" style="color:#00FFE7">Admin Settings</h3>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      {#each [
        { key: 'feeReceiver', label: 'Fee Receiver',   cur: cfg.feeReceiver.slice(0,10)+'…', ph: '0x...', type: 'text' },
        { key: 'firstUser',   label: 'Contract Owner', cur: cfg.firstUser.slice(0,10)+'…',   ph: '0x...', type: 'text' },
      ] as f}
        <div class="card p-4">
          <div class="mb-2 flex items-center justify-between">
            <div>
              <p class="text-xs text-text-muted">{f.label}</p>
              <p class="mt-0.5 font-mono text-sm font-bold text-text-primary">{f.cur}</p>
            </div>
            {#if editField !== f.key}
              <button on:click={() => { editField = f.key; editVal = ''; }}
                      class="rounded-xl px-3 py-1.5 text-xs font-bold transition-colors hover:opacity-80"
                      style="background:var(--color-surface-3); color:#00FFE7">Update ▼</button>
            {/if}
          </div>
          {#if editField === f.key}
            <input bind:value={editVal} type={f.type} placeholder={f.ph} use:focus
                   class="mb-2 w-full rounded-xl border border-border px-3 py-2 font-mono text-sm outline-none focus:border-amber-400"
                   style="background:var(--color-surface-3); color:var(--color-text-primary)" />
            <div class="flex gap-2">
              <button on:click={handlers[f.key]} disabled={busy || !editVal}
                      class="flex-1 rounded-xl py-2 text-sm font-bold text-black disabled:opacity-50"
                      style="background:linear-gradient(135deg,#00FFE7,#1762FF)">
                {busy ? '…' : '✓ Save'}
              </button>
              <button on:click={() => { editField = null; editVal = ''; }} class="flex-1 btn-outline py-2 text-sm">✕ Cancel</button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <!-- SECTION 2: Investment & Plan -->
  <section>
    <div class="mb-4 flex items-center gap-2">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-black" style="background:linear-gradient(135deg,#36FF6F,#00FFE7)">2</span>
      <h3 class="text-lg font-bold" style="color:#36FF6F">Investment & Plan</h3>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      {#each [
        { key: 'dRoiPer',       label: 'Daily ROI %',         cur: `${cfg.dRoiPer/100}% (${cfg.dRoiPer} bps)`, ph: 'e.g. 0.50', type: 'number' },
        { key: 'minInvest',     label: 'Min Investment USDT', cur: fmt(cfg.minInvest),        ph: 'e.g. 100',  type: 'number' },
        { key: 'maxInvest',     label: 'Max Investment USDT', cur: fmt(cfg.maxInvest),        ph: 'e.g. 1000', type: 'number' },
        { key: 'investMultiple',label: 'Investment Step USDT',cur: fmt(cfg.investMultiple),   ph: 'e.g. 100',  type: 'number' },
        { key: 'roiMult',       label: 'ROI Multiplier',      cur: `${cfg.roiMult}×`,         ph: 'e.g. 2',    type: 'number' },
        { key: 'workingMult',   label: 'Working Cap (Total)', cur: `${cfg.workingMult}×`,     ph: 'e.g. 4',    type: 'number' },
      ] as f}
        <div class="card p-4">
          <div class="mb-2 flex items-center justify-between">
            <div>
              <p class="text-xs text-text-muted">{f.label}</p>
              <p class="mt-0.5 text-lg font-bold text-text-primary">{f.cur}</p>
            </div>
            {#if editField !== f.key}
              <button on:click={() => { editField = f.key; editVal = ''; }}
                      class="rounded-xl px-3 py-1.5 text-xs font-bold"
                      style="background:var(--color-surface-3); color:#36FF6F">Update ▼</button>
            {/if}
          </div>
          {#if editField === f.key}
            <input bind:value={editVal} type={f.type} step="0.01" placeholder={f.ph} use:focus
                   class="mb-2 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-amber-400"
                   style="background:var(--color-surface-3); color:var(--color-text-primary)" />
            <div class="flex gap-2">
              <button on:click={handlers[f.key]} disabled={busy || !editVal}
                      class="flex-1 rounded-xl py-2 text-sm font-bold text-black disabled:opacity-50"
                      style="background:linear-gradient(135deg,#36FF6F,#00FFE7)">
                {busy ? '…' : '✓ Save'}
              </button>
              <button on:click={() => { editField = null; editVal = ''; }} class="flex-1 btn-outline py-2 text-sm">✕ Cancel</button>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Day Length with unit selector -->
      <div class="card p-4">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <p class="text-xs text-text-muted">Day Length</p>
            <p class="mt-0.5 text-lg font-bold text-text-primary">{cfg.dayLength}s ({(cfg.dayLength/3600).toFixed(1)}h)</p>
          </div>
          {#if editField !== 'dayLength'}
            <button on:click={() => { editField = 'dayLength'; editVal = ''; }}
                    class="rounded-xl px-3 py-1.5 text-xs font-bold"
                    style="background:var(--color-surface-3); color:#36FF6F">Update ▼</button>
          {/if}
        </div>
        {#if editField === 'dayLength'}
          <div class="mb-2 flex gap-2">
            <input bind:value={editVal} type="number" step="0.1" placeholder="24" use:focus
                   class="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-amber-400"
                   style="background:var(--color-surface-3); color:var(--color-text-primary)" />
            <select bind:value={timeUnit}
                    class="rounded-xl border border-border px-2 py-2 text-sm outline-none"
                    style="background:var(--color-surface-3); color:var(--color-text-primary)">
              <option value="days">days</option>
              <option value="hours">hours</option>
              <option value="minutes">min</option>
              <option value="seconds">sec</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button on:click={handlers['dayLength']} disabled={busy || !editVal}
                    class="flex-1 rounded-xl py-2 text-sm font-bold text-black disabled:opacity-50"
                    style="background:linear-gradient(135deg,#36FF6F,#00FFE7)">
              {busy ? '…' : '✓ Save'}
            </button>
            <button on:click={() => { editField = null; editVal = ''; }} class="flex-1 btn-outline py-2 text-sm">✕ Cancel</button>
          </div>
        {/if}
      </div>
    </div>
  </section>

  <!-- SECTION 3: Withdrawal -->
  <section>
    <div class="mb-4 flex items-center gap-2">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-black" style="background:linear-gradient(135deg,#FF8C42,#FF5833)">3</span>
      <h3 class="text-lg font-bold" style="color:#FF8C42">Withdrawal Settings</h3>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      {#each [
        { key: 'minWithdraw',  label: 'Min Withdrawal USDT', cur: fmt(cfg.minWithdraw),          ph: 'e.g. 10',  type: 'number' },
        { key: 'withdrawFee',  label: 'Withdrawal Fee %',    cur: `${cfg.withdrawFee/100}% (${cfg.withdrawFee} bps)`, ph: 'e.g. 5',   type: 'number' },
        { key: 'directRefPer', label: 'Direct Referral %',   cur: `${cfg.directRefPer/100}% (${cfg.directRefPer} bps)`, ph: 'e.g. 5', type: 'number' },
      ] as f}
        <div class="card p-4">
          <div class="mb-2 flex items-center justify-between">
            <div>
              <p class="text-xs text-text-muted">{f.label}</p>
              <p class="mt-0.5 text-lg font-bold text-text-primary">{f.cur}</p>
            </div>
            {#if editField !== f.key}
              <button on:click={() => { editField = f.key; editVal = ''; }}
                      class="rounded-xl px-3 py-1.5 text-xs font-bold"
                      style="background:var(--color-surface-3); color:#FF8C42">Update ▼</button>
            {/if}
          </div>
          {#if editField === f.key}
            <input bind:value={editVal} type={f.type} step="0.01" placeholder={f.ph} use:focus
                   class="mb-2 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-amber-400"
                   style="background:var(--color-surface-3); color:var(--color-text-primary)" />
            <div class="flex gap-2">
              <button on:click={handlers[f.key]} disabled={busy || !editVal}
                      class="flex-1 rounded-xl py-2 text-sm font-bold text-white disabled:opacity-50"
                      style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
                {busy ? '…' : '✓ Save'}
              </button>
              <button on:click={() => { editField = null; editVal = ''; }} class="flex-1 btn-outline py-2 text-sm">✕ Cancel</button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <!-- SECTION 4: Bonanza Leg Percentages -->
  <section>
    <div class="mb-4 flex items-center gap-2">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-black" style="background:linear-gradient(135deg,#f59e0b,#FF8C42)">4</span>
      <h3 class="text-lg font-bold text-amber-400">Bonanza Leg Percentages</h3>
    </div>
    <div class="card p-5">
      <div class="mb-4 grid grid-cols-3 gap-3 text-center">
        {#each [
          { k: 'Power Leg',   v: cfg.powerLegPct,   c: '#00FFE7' },
          { k: 'Weaker Leg',  v: cfg.weakerLegPct,  c: '#36FF6F' },
          { k: 'Weakest Leg', v: cfg.weakestLegPct, c: '#f59e0b' },
        ] as l}
          <div class="rounded-xl px-3 py-3" style="background:var(--color-surface-3)">
            <p class="text-xs text-text-muted">{l.k}</p>
            <p class="mt-1 text-2xl font-bold" style="color:{l.c}">{l.v}%</p>
          </div>
        {/each}
      </div>
      <div class="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p class="mb-1 text-xs text-text-muted">Power %</p>
          <input bind:value={legPower} type="number" placeholder="40"
                 class="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none"
                 style="background:var(--color-surface-3); color:var(--color-text-primary)" />
        </div>
        <div>
          <p class="mb-1 text-xs text-text-muted">Weaker %</p>
          <input bind:value={legWeaker} type="number" placeholder="30"
                 class="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none"
                 style="background:var(--color-surface-3); color:var(--color-text-primary)" />
        </div>
        <div>
          <p class="mb-1 text-xs text-text-muted">Weakest %</p>
          <input bind:value={legWeakest} type="number" placeholder="30"
                 class="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none"
                 style="background:var(--color-surface-3); color:var(--color-text-primary)" />
        </div>
      </div>
      {#if legPower && legWeaker && legWeakest}
        {@const sum = parseInt(legPower||'0') + parseInt(legWeaker||'0') + parseInt(legWeakest||'0')}
        <p class="mb-2 text-xs" style="color:{sum===100 ? '#36FF6F' : '#FF5833'}">
          Sum: {sum}% {sum === 100 ? '✓' : '(must equal 100)'}
        </p>
      {/if}
      <button on:click={updateLegs} disabled={legBusy || !legPower || !legWeaker || !legWeakest}
              class="w-full rounded-xl py-2.5 text-sm font-bold text-black disabled:opacity-50"
              style="background:linear-gradient(135deg,#f59e0b,#FF8C42)">
        {legBusy ? 'Updating…' : 'Update Leg Percentages'}
      </button>
    </div>
  </section>

  <!-- SECTION 5: Rank Configuration -->
  <section>
    <div class="mb-4 flex items-center gap-2">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-black" style="background:linear-gradient(135deg,#a78bfa,#8b5cf6)">5</span>
      <h3 class="text-lg font-bold" style="color:#a78bfa">Rank Configuration</h3>
    </div>
    <div class="card p-5" style="border-color:rgba(167,139,250,0.2)">
      <p class="mb-4 text-xs text-text-muted">Set target business and daily salary for each rank level (L1-L10)</p>
      <div class="space-y-3">
        {#each [0,1,2,3,4,5,6,7,8,9] as i}
          <div class="flex flex-wrap items-center gap-3 p-3 rounded-xl" style="background:var(--color-surface-3)">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:rgba(167,139,250,0.2); color:#a78bfa">
              L{i+1}
            </div>
            <div class="flex-1 min-w-[120px]">
              <p class="text-xs text-text-muted mb-1">
                Target ($)
                {#if currentRankTargets[i]}
                  <span class="ml-1" style="color:#a78bfa">Current: {fmt(currentRankTargets[i])}</span>
                {/if}
              </p>
              <input type="number" bind:value={rankTargets[i]} placeholder="e.g. 2500"
                class="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary outline-none focus:border-purple-400"
                style="background:var(--color-surface-4)" />
            </div>
            <div class="flex-1 min-w-[100px]">
              <p class="text-xs text-text-muted mb-1">
                Per Day ($)
                {#if currentRankPerDay[i]}
                  <span class="ml-1" style="color:#a78bfa">Current: {fmt(currentRankPerDay[i])}</span>
                {/if}
              </p>
              <input type="number" bind:value={rankPerDay[i]} placeholder="e.g. 5"
                class="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary outline-none focus:border-purple-400"
                style="background:var(--color-surface-4)" />
            </div>
            <button on:click={() => updateRank(i)} disabled={rankBusy || !rankTargets[i] || !rankPerDay[i]}
              class="px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
              style="background:linear-gradient(135deg,#a78bfa,#8b5cf6)">
              {rankBusy ? '…' : 'Update'}
            </button>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- SECTION 6: Create Bonanza -->
  <section>
    <div class="mb-4 flex items-center gap-2">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-black" style="background:linear-gradient(135deg,#FF6B9D,#FF8C42)">6</span>
      <h3 class="text-lg font-bold" style="color:#FF8C42">Create Bonanza ({cfg.bonanzaCount} existing)</h3>
    </div>
    <div class="card p-5 space-y-4">
      <input bind:value={bnName} type="text" placeholder="Bonanza name (e.g. Summer Bonanza 2025)"
             class="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-amber-400"
             style="background:var(--color-surface-3); color:var(--color-text-primary)" />

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <p class="mb-1 text-xs text-text-muted">Start Date & Time</p>
          <input bind:value={bnStart} type="datetime-local"
                 class="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none"
                 style="background:var(--color-surface-3); color:var(--color-text-primary)" />
        </div>
        <div>
          <p class="mb-1 text-xs text-text-muted">End Date & Time</p>
          <input bind:value={bnEnd} type="datetime-local"
                 class="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none"
                 style="background:var(--color-surface-3); color:var(--color-text-primary)" />
        </div>
      </div>

      <!-- Tiers -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <p class="text-sm font-bold text-text-primary">Reward Tiers</p>
          <button on:click={addTier} class="flex items-center gap-1 text-xs" style="color:#00FFE7">
            + Add Tier
          </button>
        </div>

        <div class="space-y-2">
          {#each bnTiers as tier, i}
            <div class="rounded-xl border border-border p-3" style="background:var(--color-surface-3)">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-bold text-amber-400">Tier {i + 1}</span>
                {#if bnTiers.length > 1}
                  <button on:click={() => removeTier(i)} class="text-xs text-red-400 hover:text-red-300">✕ Remove</button>
                {/if}
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <p class="mb-1 text-xs text-text-muted">Direct Target (USDT)</p>
                  <input value={tier.direct} on:input={(e) => updateTier(i, 'direct', (e.target as HTMLInputElement).value)}
                         type="number" placeholder="0"
                         class="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none"
                         style="background:var(--color-surface-2); color:var(--color-text-primary)" />
                  <p class="mt-0.5 text-xs text-text-muted">0 = no requirement</p>
                </div>
                <div>
                  <p class="mb-1 text-xs text-text-muted">Team Target (USDT)</p>
                  <input value={tier.team} on:input={(e) => updateTier(i, 'team', (e.target as HTMLInputElement).value)}
                         type="number" placeholder="10000"
                         class="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none"
                         style="background:var(--color-surface-2); color:var(--color-text-primary)" />
                </div>
                <div>
                  <p class="mb-1 text-xs text-text-muted">Reward (USDT)</p>
                  <input value={tier.reward} on:input={(e) => updateTier(i, 'reward', (e.target as HTMLInputElement).value)}
                         type="number" placeholder="500"
                         class="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none"
                         style="background:var(--color-surface-2); color:var(--color-text-primary)" />
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <button on:click={createBonanza} disabled={bnBusy}
              class="w-full rounded-xl py-3 text-sm font-bold text-black disabled:opacity-50"
              style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
        {bnBusy ? 'Creating…' : '🏆 Create Bonanza'}
      </button>
    </div>
  </section>

  {/if}
</div>
