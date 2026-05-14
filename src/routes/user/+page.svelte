<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { readContract } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { env } from '$lib/constants/env';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { formatUnits, isAddress } from 'viem';
  import DashboardNav from '$lib/components/dashboard/DashboardNav.svelte';
  import OverviewTab  from '$lib/components/dashboard/OverviewTab.svelte';
  import EarningsTab  from '$lib/components/dashboard/EarningsTab.svelte';
  import PackagesTab  from '$lib/components/dashboard/PackagesTab.svelte';
  import TeamTab      from '$lib/components/dashboard/TeamTab.svelte';
  import BonanzaTab   from '$lib/components/dashboard/BonanzaTab.svelte';
  import type { IncomeData, UserInfo, TeamData, Pkg } from '$lib/types/dashboard';

  type Tab = 'overview' | 'earnings' | 'packages' | 'team' | 'bonanza';
  let activeTab: Tab = 'overview';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  // ── Search state ──────────────────────────────────────────
  let searchInput = '';
  let searching   = false;
  let searchErr   = '';

  // ── Loaded user state ─────────────────────────────────────
  let loaded      = false;
  let loading     = false;
  let error       = '';
  let userId      = 0n;
  let userAddress = '';
  let workingMult = 4;

  let income: IncomeData = {
    availableBal: 0n, totalWithdrawn: 0n,
    totalRoi: 0n, totalReferral: 0n, totalLevel: 0n, totalSalary: 0n,
  };
  let user: UserInfo = {
    userId: 0n, referrerId: 0n, directCount: 0n, totalInvested: 0n,
  };
  let packages: Pkg[]  = [];
  let team: TeamData   = {
    counts:   Array.from({ length: 10 }, () => 0),
    business: Array.from({ length: 10 }, () => 0n),
  };

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

  function short(addr: string) {
    return addr.slice(0, 6) + '…' + addr.slice(-4);
  }

  // ── Resolve input → {uid, addr} ───────────────────────────
  async function resolve(input: string): Promise<{ uid: bigint; addr: string } | null> {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const cfg = getWagmiConfig();
    if (!cfg) { searchErr = 'Wallet not initialised yet'; return null; }

    if (isAddress(trimmed)) {
      const uid = await readContract(cfg, {
        address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [trimmed as `0x${string}`],
      }) as unknown as bigint;
      if (uid === 0n) return null;
      return { uid, addr: trimmed };
    }

    const num = parseInt(trimmed);
    if (isNaN(num) || num <= 0) return null;
    const addr = await readContract(cfg, {
      address: PROXY, abi: arizeBizV2Abi, functionName: 'idToAddr', args: [num],
    }) as unknown as string;
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return null;
    return { uid: BigInt(num), addr };
  }

  // ── Load all data for resolved user ───────────────────────
  async function loadUser(uid: bigint, addr: string) {
    loading = true; error = '';
    try {
      const cfg = getWagmiConfig();
      if (!cfg) { error = 'Not initialised'; loading = false; return; }
      const id = Number(uid);

      const [inc, ui, wm] = await Promise.all([
        readContract(cfg, { address: PROXY, abi: arizeBizV2Abi, functionName: 'incomeInfo',        args: [id] }),
        readContract(cfg, { address: PROXY, abi: arizeBizV2Abi, functionName: 'userInfo',          args: [id] }),
        readContract(cfg, { address: PROXY, abi: arizeBizV2Abi, functionName: 'workingMultiplier', args: [] }),
      ]);

      const i = inc as unknown as [bigint, bigint, bigint, bigint, bigint, bigint];
      income = {
        availableBal:   i[0],
        totalWithdrawn: i[1],
        totalRoi:       i[2],
        totalReferral:  i[3],
        totalLevel:     i[4],
        totalSalary:    i[5],
      };

      const u = ui as unknown as [number, boolean, bigint];
      workingMult = Number(wm);

      const loadedPkgs: Pkg[] = [];
      let totalInv = 0n;
      for (let idx = 0; idx < 20; idx++) {
        try {
          const p = await readContract(cfg, {
            address: PROXY, abi: arizeBizV2Abi, functionName: 'packages',
            args: [id, BigInt(idx)],
          }) as unknown as [bigint, bigint, bigint, number, number, number, boolean, number];
          if (p[0] === 0n) break;
          loadedPkgs.push({
            amount: p[0], used: p[1], roiUsed: p[2],
            startTime: p[3], daysClaimed: p[4], dailyRoi: p[5],
            isActive: p[6], packageType: p[7],
          });
          totalInv += p[0];
        } catch { break; }
      }
      packages = loadedPkgs;

      user = {
        userId:        uid,
        referrerId:    BigInt(u[0]),
        directCount:   u[2],
        totalInvested: totalInv,
      };

      try {
        const ti = await readContract(cfg, {
          address: PROXY, abi: arizeBizV2Abi, functionName: 'getTeamInfo', args: [addr as `0x${string}`],
        }) as unknown as { counts: number[]; business: bigint[] };
        team = { counts: [...ti.counts], business: [...ti.business] };
      } catch { /* optional */ }

      userId      = uid;
      userAddress = addr;
      loaded      = true;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load user data';
    } finally { loading = false; }
  }

  // ── Search handler ────────────────────────────────────────
  async function handleSearch() {
    if (!searchInput.trim()) return;
    searching = true; searchErr = ''; loaded = false;
    try {
      const result = await resolve(searchInput);
      if (!result) { searchErr = 'User not found. Check the ID or address.'; searching = false; return; }
      await loadUser(result.uid, result.addr);
    } catch {
      searchErr = 'Lookup failed. Try again.';
    } finally { searching = false; }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  // ── Auto-load from URL params ─────────────────────────────
  onMount(async () => {
    await initWeb3();
    const id   = $page.url.searchParams.get('id');
    const addr = $page.url.searchParams.get('addr');
    if (id)   { searchInput = id;   await handleSearch(); }
    if (addr) { searchInput = addr; await handleSearch(); }
  });
</script>

<svelte:head>
  <title>{loaded ? `User AB${userId} — ArizeBiz` : 'User Lookup — ArizeBiz'}</title>
</svelte:head>

<div class="min-h-screen" style="background:var(--color-surface)">

  <!-- Topbar -->
  <div class="sticky top-0 z-40 flex justify-center px-4 py-3">
    <header class="flex items-center gap-3 rounded-full px-3 py-2"
            style="background:rgba(17,17,24,0.92);backdrop-filter:blur(16px);border:1px solid rgba(245,158,11,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.4)">
      <a href="/" class="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-white/5">
        <div class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black"
             style="background:linear-gradient(135deg,#f59e0b,#d97706)">AB</div>
        <span class="text-sm font-bold">Arize<span class="gold-text">Biz</span></span>
      </a>
      <div class="h-5 w-px" style="background:rgba(245,158,11,0.2)"></div>
      <span class="rounded-full px-3 py-1 text-xs font-semibold text-text-muted"
            style="background:var(--color-surface-3)">Public View</span>
    </header>
  </div>

  <div class="mx-auto max-w-5xl px-4 py-6 pb-24">

    <!-- Search card -->
    <div class="card mb-6 p-5">
      <h2 class="mb-1 font-bold gold-text text-lg">User Lookup</h2>
      <p class="mb-4 text-xs text-text-muted">Enter a User ID (e.g. 5) or wallet address (0x…) to view public stats.</p>
      <div class="flex gap-2">
        <input
          bind:value={searchInput}
          on:keydown={handleKey}
          type="text"
          placeholder="User ID or 0x address…"
          class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary
                 outline-none focus:border-gold transition-colors"
          style="background:var(--color-surface-3)"
        />
        <button on:click={handleSearch} disabled={searching || !searchInput.trim()}
                class="btn-primary px-5 py-2.5 text-sm min-w-[80px]">
          {searching ? '…' : 'Search'}
        </button>
      </div>
      {#if searchErr}
        <p class="mt-2 text-xs text-error">{searchErr}</p>
      {/if}
    </div>

    <!-- Loading -->
    {#if loading}
      <div class="flex h-52 items-center justify-center">
        <div class="gold-text animate-pulse text-xl">Loading…</div>
      </div>

    {:else if error}
      <div class="card p-8 text-center text-error">{error}</div>

    {:else if loaded}

      <!-- User info bar -->
      <div class="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <span class="rounded-full border border-border px-3 py-1 font-medium text-gold"
              style="background:var(--color-gold-dim)">AB{userId}</span>
        <span class="rounded-full border border-border px-3 py-1 font-mono text-xs"
              style="background:var(--color-surface-3)" title={userAddress}>
          {short(userAddress)}
        </span>
        <span class="rounded-full border border-border px-3 py-1" style="background:var(--color-surface-3)">
          Referrer AB{user.referrerId}
        </span>
        <span class="rounded-full border border-border px-3 py-1" style="background:var(--color-surface-3)">
          {user.directCount} Directs
        </span>
      </div>

      <!-- Active Package Card -->
      {#if packages.length > 0}
        {@const pkg = packages[packages.length - 1]}
        {@const dailyAmount = (pkg.amount * BigInt(pkg.dailyRoi)) / 10000n}
        {@const daysRunning = Math.floor((Date.now() / 1000 - pkg.startTime) / 86400)}
        {@const roiPending = dailyAmount * BigInt(Math.max(0, daysRunning - pkg.daysClaimed))}
        <div class="card mb-6 p-5" style="border-left:3px solid #f59e0b">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-text-secondary uppercase tracking-wide">Active Package</h3>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold {pkg.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
              {pkg.isActive ? 'ACTIVE' : 'EXPIRED'}
            </span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div class="text-xs text-text-muted mb-1">Invested</div>
              <div class="text-xl font-bold gold-text">${fmt(pkg.amount)}</div>
            </div>
            <div>
              <div class="text-xs text-text-muted mb-1">Daily ROI ({(pkg.dailyRoi / 100).toFixed(2)}%)</div>
              <div class="text-xl font-bold" style="color:#22c55e">${fmt(dailyAmount)}</div>
            </div>
            <div>
              <div class="text-xs text-text-muted mb-1">Days Running</div>
              <div class="text-xl font-bold" style="color:#3b82f6">{daysRunning}</div>
            </div>
            <div>
              <div class="text-xs text-text-muted mb-1">ROI Pending</div>
              <div class="text-xl font-bold" style="color:#a78bfa">${fmt(roiPending)}</div>
            </div>
          </div>
          <div class="mt-3 text-xs text-text-muted">
            Started {new Date(pkg.startTime * 1000).toLocaleDateString('en-IN')} • {pkg.daysClaimed} days claimed
          </div>
        </div>
      {/if}

      <!-- Stats row -->
      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {#each [
          { label:'Available',  val: income.availableBal,   c:'#f59e0b' },
          { label:'Total ROI',  val: income.totalRoi,       c:'#22c55e' },
          { label:'Referral',   val: income.totalReferral,  c:'#3b82f6' },
          { label:'Level',      val: income.totalLevel,     c:'#e2e8f0' },
          { label:'Salary',     val: income.totalSalary,    c:'#a78bfa' },
          { label:'Withdrawn',  val: income.totalWithdrawn, c:'#6b7280' },
        ] as s}
          <div class="card p-3 text-center">
            <div class="text-base font-bold" style="color:{s.c}">${fmt(s.val)}</div>
            <div class="mt-0.5 text-xs text-text-muted">{s.label}</div>
          </div>
        {/each}
      </div>

      <!-- Tab components (readonly) -->
      {#if activeTab === 'overview'}
        <OverviewTab {income} {user} readonly />

      {:else if activeTab === 'earnings'}
        <EarningsTab {income} readonly />

      {:else if activeTab === 'packages'}
        <PackagesTab {packages} {workingMult} />

      {:else if activeTab === 'team'}
        <TeamTab userId={user.userId} directCount={user.directCount} {team} />

      {:else if activeTab === 'bonanza'}
        <BonanzaTab userAddress={userAddress} userId={Number(userId)} salaryAmount={income.totalSalary} readonly />
      {/if}

    {:else}
      <!-- Empty state -->
      <div class="card p-10 text-center mt-4">
        <div class="mb-3 text-4xl">🔍</div>
        <p class="text-text-muted">Enter a User ID or address above to view their stats.</p>
      </div>
    {/if}

  </div>

  {#if loaded && !loading}
    <DashboardNav {activeTab} onTabChange={(t) => activeTab = t as Tab} />
  {/if}

</div>
