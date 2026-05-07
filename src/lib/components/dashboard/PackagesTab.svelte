<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { formatUnits } from 'viem';
  import type { Pkg } from '$lib/types/dashboard';

  export let packages:    Pkg[]   = [];
  export let workingMult: number  = 3;
  export let dayLength:   number  = 86400;
  export let txLoading:   boolean = false;

  const dispatch = createEventDispatcher();

  // ── Ticker ─────────────────────────────────────────────────
  let now = Math.floor(Date.now() / 1000);
  let ticker: ReturnType<typeof setInterval>;

  onMount(() => {
    ticker = setInterval(() => { now = Math.floor(Date.now() / 1000); }, 1000);
  });
  onDestroy(() => clearInterval(ticker));

  // ── Helpers ────────────────────────────────────────────────
  function fmt(val: bigint, dec = 18, digits = 2) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: digits, maximumFractionDigits: digits,
    });
  }
  function fmtDate(ts: number) {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function pad(n: number) { return String(n).padStart(2, '0'); }

  // ── Per-package computed values (reactive on `now`) ────────
  function pkgData(pkg: Pkg) {
    const dl        = dayLength || 86400;
    const dailyAmt  = Number(formatUnits(pkg.amount, 18)) * pkg.dailyRoi / 10000; // $ per day
    const elapsed   = now - pkg.startTime;
    const totalDays = Math.floor(elapsed / dl);
    const pendingDays = Math.max(0, totalDays - pkg.daysClaimed);

    // How far into the current unclaimed day (0→1)
    const secsIntoDay = elapsed - totalDays * dl;
    const dayFrac     = secsIntoDay / dl;

    // Pending claimable (full days only)
    const pendingRoi  = dailyAmt * pendingDays;

    // Live visual amount: claimable + fraction of current accruing day
    const liveRoi     = pendingRoi + dailyAmt * dayFrac;

    // Countdown to next full day
    const secsLeft    = dl - secsIntoDay;
    const hh = Math.floor(secsLeft / 3600);
    const mm = Math.floor((secsLeft % 3600) / 60);
    const ss = secsLeft % 60;
    const countdown   = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;

    // Daily progress bar (0-100)
    const dayPct = Math.min(100, dayFrac * 100);

    // Working cap progress
    const limit    = pkg.amount * BigInt(workingMult);
    const capPct   = limit > 0n ? Math.min(100, Number((pkg.used * 100n) / limit)) : 0;

    return { dailyAmt, pendingDays, pendingRoi, liveRoi, countdown, dayPct, limit, capPct };
  }

  $: activeCount  = packages.filter(p => p.isActive).length;
  $: expiredCount = packages.length - activeCount;
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="font-bold gold-text">My Packages</h3>
      {#if packages.length > 0}
        <p class="text-xs text-text-muted mt-0.5">{activeCount} active · {expiredCount} expired</p>
      {/if}
    </div>
    {#if activeCount === 0}
      <a href="/register" class="btn-primary px-4 py-2 text-sm">+ Add Package</a>
    {/if}
  </div>

  <!-- Empty state -->
  {#if packages.length === 0}
    <div class="card p-12 text-center">
      <div class="mb-4 text-5xl">📦</div>
      <h4 class="mb-1 font-bold text-text-primary">No Packages Yet</h4>
      <p class="mb-5 text-sm text-text-secondary">Invest to start earning daily ROI.</p>
      <a href="/register" class="btn-primary px-8 py-3">Invest Now</a>
    </div>

  {:else}
    {#each packages as pkg, i}
      {@const d = pkgData(pkg)}

      <div class="card p-5 transition-opacity {pkg.isActive ? '' : 'opacity-55'}">

        <!-- Top row: title + badge -->
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <span class="font-semibold text-text-primary">Package #{i + 1}</span>
            {#if pkg.packageType === 1}
              <span class="ml-2 rounded-full px-2 py-0.5 text-xs font-bold"
                    style="background:rgba(0,255,231,0.12);color:#00FFE7;border:1px solid rgba(0,255,231,0.3)">Granted</span>
            {/if}
            <span class="ml-1 text-xs text-text-muted">
              {(pkg.dailyRoi / 100).toFixed(2)}%/day · {pkg.daysClaimed} days claimed
            </span>
          </div>
          <span class="shrink-0 rounded-full px-3 py-0.5 text-xs font-bold
                       {pkg.isActive ? 'text-success' : 'text-text-muted'}"
                style="{pkg.isActive
                  ? 'background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35)'
                  : 'background:var(--color-surface-3)'}">
            {pkg.isActive ? '● Active' : '○ Expired'}
          </span>
        </div>

        {#if pkg.isActive}
          <!-- ── ROI Live Panel ── -->
          <div class="mb-4 rounded-2xl p-4" style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.15)">

            <!-- Live ticker -->
            <div class="mb-3 text-center">
              <p class="mb-0.5 text-xs text-text-muted">Live Accruing</p>
              <div class="text-3xl font-bold tabular-nums" style="color:#22c55e">
                ${d.liveRoi.toFixed(6)}
              </div>
              <p class="mt-0.5 text-xs text-text-muted">USDT</p>
            </div>

            <!-- Pending claimable vs daily -->
            <div class="mb-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div class="rounded-xl p-2.5" style="background:var(--color-surface-3)">
                <p class="text-text-muted">Pending (claimable)</p>
                <p class="mt-0.5 text-base font-bold" style="color:#22c55e">
                  ${d.pendingRoi.toFixed(4)}
                </p>
                <p class="text-text-muted">{d.pendingDays} day{d.pendingDays !== 1 ? 's' : ''}</p>
              </div>
              <div class="rounded-xl p-2.5" style="background:var(--color-surface-3)">
                <p class="text-text-muted">Daily ROI Amount</p>
                <p class="mt-0.5 text-base font-bold gold-text">${d.dailyAmt.toFixed(4)}</p>
                <p class="text-text-muted">{(pkg.dailyRoi / 100).toFixed(2)}%/day</p>
              </div>
            </div>

            <!-- Daily progress bar + countdown -->
            <div class="mb-3">
              <div class="mb-1 flex justify-between text-xs">
                <span class="text-text-muted">Daily Progress</span>
                <span class="font-mono font-bold" style="color:#00FFE7">{d.countdown}</span>
              </div>
              <div class="h-2.5 rounded-full overflow-hidden" style="background:var(--color-surface-4)">
                <div class="h-full rounded-full transition-none"
                     style="width:{d.dayPct}%;background:linear-gradient(90deg,#00FFE7,#1762FF)"></div>
              </div>
              <div class="mt-1 flex justify-between text-xs text-text-muted">
                <span>{d.dayPct.toFixed(1)}% of day complete</span>
                <span>Next ROI in {d.countdown}</span>
              </div>
            </div>

            <!-- Claim button -->
            <button
              on:click={() => dispatch('claimROI')}
              disabled={d.pendingDays === 0 || txLoading}
              class="w-full rounded-xl py-3 text-sm font-bold transition-all
                     {d.pendingDays > 0 && !txLoading
                       ? 'text-black hover:-translate-y-0.5'
                       : 'opacity-40 cursor-not-allowed text-text-muted'}"
              style="{d.pendingDays > 0 && !txLoading
                ? 'background:linear-gradient(135deg,#22c55e,#16a34a)'
                : 'background:var(--color-surface-3)'}">
              {#if txLoading}
                <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></span>
                Processing…
              {:else if d.pendingDays > 0}
                Claim ${d.pendingRoi.toFixed(4)} ROI ({d.pendingDays} day{d.pendingDays !== 1 ? 's' : ''})
              {:else}
                No ROI to claim yet — {d.countdown}
              {/if}
            </button>
          </div>
        {/if}

        <!-- Stats grid -->
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
          <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
            <div class="text-text-muted">Invested</div>
            <div class="mt-0.5 font-bold gold-text">${fmt(pkg.amount)}</div>
          </div>
          <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
            <div class="text-text-muted">ROI Earned</div>
            <div class="mt-0.5 font-bold" style="color:#22c55e">${fmt(pkg.roiUsed)}</div>
          </div>
          <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
            <div class="text-text-muted">Cap ({workingMult}×)</div>
            <div class="mt-0.5 font-bold text-text-primary">${fmt(d.limit)}</div>
          </div>
          <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
            <div class="text-text-muted">Start Date</div>
            <div class="mt-0.5 font-semibold text-text-secondary">{fmtDate(pkg.startTime)}</div>
          </div>
        </div>

        <!-- Working cap progress bar -->
        <div class="mt-3">
          <div class="mb-1 flex justify-between text-xs text-text-muted">
            <span>Working Cap Progress</span>
            <span class="{d.capPct >= 100 ? 'text-success font-bold' : ''}">{d.capPct.toFixed(1)}%</span>
          </div>
          <div class="h-2 rounded-full overflow-hidden" style="background:var(--color-surface-4)">
            <div class="h-full rounded-full transition-all duration-500"
                 style="width:{d.capPct}%;background:{d.capPct >= 100 ? '#22c55e' : 'linear-gradient(90deg,#f59e0b,#d97706)'}">
            </div>
          </div>
          <div class="mt-1 flex justify-between text-xs text-text-muted">
            <span>${fmt(pkg.used)} used</span>
            <span>${fmt(d.limit)} cap</span>
          </div>
        </div>

      </div>
    {/each}
  {/if}
</div>
