<script lang="ts">
  import { onMount } from 'svelte';
  import { readContract } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits } from 'viem';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;
  const DAYS_TO_SHOW = 30;

  // ── IST day key formula (mirrors contract: (ts + 19800) / 86400) ──
  // For a date string "YYYY-MM-DD", dayKey = floor(UTC midnight ts of that date / 86400)
  function dateToDayKey(dateStr: string): number {
    return Math.floor(Date.parse(dateStr + 'T00:00:00Z') / 1000 / 86400);
  }
  function todayISTStr(): string {
    return new Date(Date.now() + 19800_000).toISOString().slice(0, 10);
  }
  function dayKeyToDateStr(key: number): string {
    return new Date(key * 86400 * 1000).toISOString().slice(0, 10);
  }

  // ── State ─────────────────────────────────────────────────
  let selectedDate = todayISTStr();
  let loading      = false;
  let error        = '';

  interface DayStat { date: string; deposits: bigint; withdrawals: bigint; }
  let today: DayStat | null = null;
  let history: DayStat[]   = [];
  let viewMode: 'today' | 'history' = 'today';

  // ── Helpers ───────────────────────────────────────────────
  function fmt(v: bigint) {
    return '$' + Number(formatUnits(v, 18)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtShort(v: bigint) {
    const n = Number(formatUnits(v, 18));
    return n >= 1_000_000 ? `$${(n/1_000_000).toFixed(2)}M`
         : n >= 1_000     ? `$${(n/1_000).toFixed(1)}K`
         : `$${n.toFixed(0)}`;
  }

  function dateNav(delta: number) {
    const k = dateToDayKey(selectedDate) + delta;
    selectedDate = dayKeyToDateStr(k);
    loadToday();
  }

  // ── Load single day ───────────────────────────────────────
  async function loadToday() {
    loading = true; error = ''; today = null;
    try {
      const key = dateToDayKey(selectedDate);
      const res = await readContract(getWagmiConfig()!, {
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'getDailyStats',
        args: [key],
      }) as [bigint, bigint];
      today = { date: selectedDate, deposits: res[0], withdrawals: res[1] };
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed';
    } finally { loading = false; }
  }

  // ── Load 30-day history ───────────────────────────────────
  async function loadHistory() {
    loading = true; error = ''; history = [];
    try {
      const todayKey = dateToDayKey(todayISTStr());
      const fromKey  = todayKey - DAYS_TO_SHOW + 1;
      const res = await readContract(getWagmiConfig()!, {
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'getDailyStatsRange',
        args: [fromKey, todayKey],
      }) as [bigint[], bigint[]];

      const rows: DayStat[] = [];
      for (let i = 0; i < res[0].length; i++) {
        rows.push({
          date:        dayKeyToDateStr(fromKey + i),
          deposits:    res[0][i],
          withdrawals: res[1][i],
        });
      }
      history = rows.reverse(); // newest first
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed';
    } finally { loading = false; }
  }

  $: netToday = today
    ? (today.deposits >= today.withdrawals
        ? today.deposits - today.withdrawals
        : -(today.withdrawals - today.deposits))
    : 0n;
  $: netPositive = today ? today.deposits >= today.withdrawals : true;

  $: totalDepH    = history.reduce((s, r) => s + r.deposits,    0n);
  $: totalWithH   = history.reduce((s, r) => s + r.withdrawals, 0n);
  $: netH         = totalDepH >= totalWithH ? totalDepH - totalWithH : -(totalWithH - totalDepH);
  $: netPositiveH = totalDepH >= totalWithH;
  $: maxBar       = history.reduce((m, r) => r.deposits > m ? r.deposits : (r.withdrawals > m ? r.withdrawals : m), 0n);

  onMount(async () => { await initWeb3(); loadToday(); });
</script>

<div class="space-y-6">

  <!-- Header + View Toggle -->
  <div class="flex flex-wrap items-center gap-3">
    <svg class="h-6 w-6" style="color:#36FF6F" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
    <h2 class="text-xl font-bold text-text-primary">Deposits & Withdrawals</h2>
    <div class="ml-auto flex items-center gap-2 rounded-xl border border-border p-1" style="background:var(--color-surface-3)">
      <button on:click={() => { viewMode = 'today'; loadToday(); }}
              class="rounded-lg px-3 py-1.5 text-sm font-bold transition-all"
              style="background:{viewMode==='today' ? 'linear-gradient(135deg,#00FFE7,#1762FF)' : 'transparent'}; color:{viewMode==='today' ? '#000' : 'var(--color-text-muted)'}">
        Daily
      </button>
      <button on:click={() => { viewMode = 'history'; loadHistory(); }}
              class="rounded-lg px-3 py-1.5 text-sm font-bold transition-all"
              style="background:{viewMode==='history' ? 'linear-gradient(135deg,#FF8C42,#FF5833)' : 'transparent'}; color:{viewMode==='history' ? '#000' : 'var(--color-text-muted)'}">
        30-Day
      </button>
    </div>
  </div>

  {#if viewMode === 'today'}
    <!-- ── DAILY VIEW ── -->
    <div class="flex items-center gap-2">
      <button on:click={() => dateNav(-1)}
              class="rounded-xl border border-border px-3 py-2 text-sm text-amber-400 hover:bg-amber-400/10 transition-colors">
        ←
      </button>
      <input type="date" bind:value={selectedDate} on:change={loadToday}
             class="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none"
             style="background:var(--color-surface-3); color:var(--color-text-primary)" />
      <button on:click={() => dateNav(1)}
              disabled={selectedDate >= todayISTStr()}
              class="rounded-xl border border-border px-3 py-2 text-sm text-amber-400 hover:bg-amber-400/10 transition-colors disabled:opacity-40">
        →
      </button>
      <button on:click={loadToday} disabled={loading}
              class="rounded-xl border border-border px-3 py-2 text-sm text-amber-400 hover:bg-amber-400/10">
        {loading ? '…' : '↻'}
      </button>
    </div>

    {#if loading}
      <div class="flex h-40 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    {:else if error}
      <div class="card p-4 text-center text-sm text-error">{error}</div>
    {:else if today}
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="card p-4 sm:p-5 text-center">
          <div class="mb-1 text-xs text-text-muted">Deposits</div>
          <div class="text-xl sm:text-3xl font-bold" style="color:#36FF6F">{fmt(today.deposits)}</div>
          <div class="mt-1 text-xs" style="color:#36FF6F66">Packages Purchased</div>
        </div>
        <div class="card p-4 sm:p-5 text-center">
          <div class="mb-1 text-xs text-text-muted">Withdrawals</div>
          <div class="text-xl sm:text-3xl font-bold" style="color:#FF8C42">{fmt(today.withdrawals)}</div>
          <div class="mt-1 text-xs" style="color:#FF8C4266">Gross Amount</div>
        </div>
        <div class="card p-4 sm:p-5 text-center">
          <div class="mb-1 text-xs text-text-muted">Net Flow</div>
          <div class="text-xl sm:text-3xl font-bold" style="color:{netPositive ? '#00FFE7' : '#FF5833'}">
            {netPositive ? '+' : '−'}{fmt(netPositive ? netToday : -netToday)}
          </div>
          <div class="mt-1 text-xs" style="color:{netPositive ? '#00FFE766' : '#FF583366'}">
            {netPositive ? 'Positive' : 'Negative'}
          </div>
        </div>
      </div>

      {#if today.deposits === 0n && today.withdrawals === 0n}
        <div class="card py-12 text-center text-sm text-text-muted">
          No activity recorded for {selectedDate} (IST).
        </div>
      {:else}
        <!-- Bar Visualization -->
        <div class="card p-5">
          <p class="mb-4 text-sm font-bold text-text-primary">{selectedDate} (IST) — Activity</p>
          {#each [
            { label: 'Deposits',    value: today.deposits,    color: '#36FF6F' },
            { label: 'Withdrawals', value: today.withdrawals, color: '#FF8C42' },
          ] as bar}
            {@const maxVal = today.deposits > today.withdrawals ? today.deposits : today.withdrawals}
            {@const pct    = maxVal > 0n ? Math.round(Number(bar.value * 100n / maxVal)) : 0}
            <div class="mb-3">
              <div class="mb-1 flex justify-between text-xs">
                <span class="font-medium" style="color:{bar.color}">{bar.label}</span>
                <span class="font-bold text-text-primary">{fmt(bar.value)}</span>
              </div>
              <div class="h-3 w-full overflow-hidden rounded-full" style="background:var(--color-surface-3)">
                <div class="h-full rounded-full transition-all duration-700"
                     style="width:{pct}%; background:{bar.color}"></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

  {:else}
    <!-- ── 30-DAY HISTORY VIEW ── -->
    {#if loading}
      <div class="flex h-40 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    {:else if error}
      <div class="card p-4 text-center text-sm text-error">{error}</div>
    {:else}
      <!-- 30-day summary totals -->
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="card p-3 sm:p-4 text-center">
          <div class="text-xs text-text-muted mb-1">30-Day Deposits</div>
          <div class="text-lg sm:text-2xl font-bold" style="color:#36FF6F">{fmt(totalDepH)}</div>
        </div>
        <div class="card p-3 sm:p-4 text-center">
          <div class="text-xs text-text-muted mb-1">30-Day Withdrawals</div>
          <div class="text-lg sm:text-2xl font-bold" style="color:#FF8C42">{fmt(totalWithH)}</div>
        </div>
        <div class="card p-3 sm:p-4 text-center">
          <div class="text-xs text-text-muted mb-1">Net Flow</div>
          <div class="text-lg sm:text-2xl font-bold" style="color:{netPositiveH ? '#00FFE7' : '#FF5833'}">
            {netPositiveH ? '+' : '−'}{fmt(netPositiveH ? netH : -netH)}
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-2xl border border-border">
        <table class="w-full min-w-[500px] text-sm">
          <thead>
            <tr style="background:var(--color-surface-3)">
              <th class="px-4 py-3 text-left text-xs text-text-muted">Date (IST)</th>
              <th class="px-4 py-3 text-right text-xs text-text-muted">Deposits</th>
              <th class="px-4 py-3 text-right text-xs text-text-muted">Withdrawals</th>
              <th class="px-4 py-3 text-right text-xs text-text-muted">Net</th>
              <th class="px-4 py-3 pr-4 text-right text-xs text-text-muted">Visual</th>
            </tr>
          </thead>
          <tbody>
            {#each history as row}
              {@const net   = row.deposits >= row.withdrawals ? row.deposits - row.withdrawals : -(row.withdrawals - row.deposits)}
              {@const netP  = row.deposits >= row.withdrawals}
              {@const barW  = maxBar > 0n ? Math.round(Number(row.deposits * 100n / maxBar)) : 0}
              {@const barW2 = maxBar > 0n ? Math.round(Number(row.withdrawals * 100n / maxBar)) : 0}
              <tr class="border-t border-border/30 transition-colors hover:bg-white/5">
                <td class="px-4 py-3 text-text-primary font-medium">{row.date}</td>
                <td class="px-4 py-3 text-right font-bold" style="color:#36FF6F">{fmtShort(row.deposits)}</td>
                <td class="px-4 py-3 text-right font-bold" style="color:#FF8C42">{fmtShort(row.withdrawals)}</td>
                <td class="px-4 py-3 text-right font-bold" style="color:{netP ? '#00FFE7' : '#FF5833'}">
                  {netP ? '+' : '−'}{fmtShort(netP ? net : -net)}
                </td>
                <td class="px-4 py-3 pr-4">
                  <div class="flex flex-col gap-0.5">
                    <div class="h-1.5 rounded-full" style="width:{barW}%; background:#36FF6F; min-width:{row.deposits > 0n ? 2 : 0}px"></div>
                    <div class="h-1.5 rounded-full" style="width:{barW2}%; background:#FF8C42; min-width:{row.withdrawals > 0n ? 2 : 0}px"></div>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>
