<script lang="ts">
  import { onMount } from 'svelte';
  import { isConnected, address,
           readContract, writeContractWithGas, waitForTransactionReceipt } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { env } from '$lib/constants/env';
  import { arizeBizV2Abi, arizeBizHubAbi } from '$lib/contracts';
  import { formatUnits, parseUnits } from 'viem';
  import DashboardNav  from '$lib/components/dashboard/DashboardNav.svelte';
  import WalletButton  from '$lib/components/WalletButton.svelte';
  import OverviewTab   from '$lib/components/dashboard/OverviewTab.svelte';
  import EarningsTab   from '$lib/components/dashboard/EarningsTab.svelte';
  import PackagesTab   from '$lib/components/dashboard/PackagesTab.svelte';
  import TeamTab       from '$lib/components/dashboard/TeamTab.svelte';
  import BonanzaTab    from '$lib/components/dashboard/BonanzaTab.svelte';
  import type { IncomeData, UserInfo, TeamData, Pkg } from '$lib/types/dashboard';
  import { toast } from 'svelte-sonner';

  type Tab = 'overview' | 'earnings' | 'packages' | 'team' | 'bonanza';
  let activeTab: Tab = 'overview';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;
  const HUB   = env.contracts.arizeBizHub   as `0x${string}`;

  // ── Typed state structs ───────────────────────────────────
  let userId       = 0n;
  let isRegistered = false;
  let workingMult  = 3;
  let withdrawFee  = 0;
  let dayLength    = 86400;
  let loading      = true;
  let error        = '';
  let txLoading    = false;

  let income: IncomeData = {
    availableBal: 0n, totalWithdrawn: 0n,
    totalRoi: 0n, totalReferral: 0n, totalLevel: 0n, totalSalary: 0n,
  };
  let user: UserInfo = {
    userId: 0n, referrerId: 0n, directCount: 0n, totalInvested: 0n,
  };
  let openLevel = 0;
  let packages: Pkg[] = [];
  let team: TeamData = {
    counts:   Array.from({ length: 10 }, () => 0),
    business: Array.from({ length: 10 }, () => 0n),
  };

  function fmt(val: bigint, dec = 18) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  const CONTRACT_ERRORS: Record<string, string> = {
    ActivePackageRequired:       '⚠️ Active package required to withdraw.',
    DailyWithdrawalLimitReached: '⏳ You have already withdrawn today. Try again tomorrow (IST).',
    BelowMinimumWithdrawal:      '⚠️ Amount is below the minimum withdrawal limit.',
    InsufficientBalance:         '⚠️ Insufficient available balance.',
    UserNotRegistered:           '⚠️ Wallet not registered.',
  };

  function parseContractError(e: unknown): string {
    const msg = e instanceof Error ? e.message : String(e);
    for (const [key, friendly] of Object.entries(CONTRACT_ERRORS)) {
      if (msg.includes(key)) return friendly;
    }
    return msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
  }

  // ── Load all data ──────────────────────────────────────────
  async function loadData() {
    if (!$address) return;
    loading = true; error = '';
    try {
      const wagmiConfig = getWagmiConfig();
      if (!wagmiConfig) { error = 'Not initialised'; loading = false; return; }
      // 1. Get user ID
      const uid = await readContract(wagmiConfig, {
        address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [$address],
      }) as unknown as bigint;
      userId = uid;
      isRegistered = uid > 0n;
      if (!isRegistered) { loading = false; return; }
      const id = Number(uid);

      // 2. Parallel reads
      const [inc, ui, wm, dl, wf] = await Promise.all([
        readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'incomeInfo',        args: [id] }),
        readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'userInfo',          args: [id] }),
        readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'workingMultiplier', args: [] }),
        readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'dayLength',        args: [] }),
        readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'withdrawFee',      args: [] }),
      ]);
      dayLength   = Number(dl) || 86400;
      withdrawFee = Number(wf) || 0;

      const i = inc as unknown as [bigint, bigint, bigint, bigint, bigint, bigint];
      // [0]=availableBalance [1]=totalWithdrawn [2]=totalRoi [3]=totalReferral [4]=totalLevel [5]=totalSalary
      income = {
        availableBal:   i[0],
        totalWithdrawn: i[1],
        totalRoi:       i[2],
        totalReferral:  i[3],
        totalLevel:     i[4],
        totalSalary:    i[5],
      };

      // userInfo → (uint32 referrerId, bool isRegistered, uint64 directReferrals)
      const u = ui as unknown as [number, boolean, bigint];
      workingMult = Number(wm);

      // Open levels
      try {
        const lv = await readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'computeLevel', args: [id] });
        openLevel = Number(lv);
      } catch { openLevel = 0; }

      // 3. Load packages by index loop (no getPackages in ABI)
      const loadedPkgs: Pkg[] = [];
      let totalInv = 0n;
      for (let idx = 0; idx < 20; idx++) {
        try {
          const p = await readContract(wagmiConfig, {
            address: PROXY, abi: arizeBizV2Abi,
            functionName: 'packages',
            args: [id, BigInt(idx)], // uint256 index needs bigint
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

      // 4. Team info (getTeamInfo takes address)
      try {
        const ti = await readContract(wagmiConfig, {
          address: PROXY, abi: arizeBizV2Abi, functionName: 'getTeamInfo', args: [$address],
        }) as unknown as { counts: number[]; business: bigint[] };
        team = { counts: [...ti.counts], business: [...ti.business] };
      } catch { /* some versions may not have this */ }

    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load data';
    } finally { loading = false; }
  }

  // ── Actions (delegated from tab events) ──────────────────
  async function claimROI() {
    txLoading = true;
    const id = toast.loading('Claiming ROI…');
    try {
      const tx = await writeContractWithGas({ address: HUB, abi: arizeBizHubAbi, functionName: 'claimROI', args: [] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('ROI claimed!', { id }); await loadData();
    } catch (e: unknown) { toast.error(parseContractError(e), { id }); }
    finally { txLoading = false; }
  }

  async function handleWithdraw(amount: string) {
    if (!amount) { toast.error('Enter amount'); return; }
    txLoading = true;
    const id = toast.loading('Withdrawing…');
    try {
      const tx = await writeContractWithGas({ address: HUB, abi: arizeBizHubAbi, functionName: 'withdraw', args: [parseUnits(amount, 18)] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('Withdrawn successfully!', { id }); await loadData();
    } catch (e: unknown) { toast.error(parseContractError(e), { id }); }
    finally { txLoading = false; }
  }

  async function checkRank() {
    txLoading = true;
    const id = toast.loading('Checking rank…');
    try {
      const tx = await writeContractWithGas({ address: HUB, abi: arizeBizHubAbi, functionName: 'checkRank', args: [] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('Rank updated!', { id }); await loadData();
    } catch (e: unknown) { toast.error(parseContractError(e), { id }); }
    finally { txLoading = false; }
  }

  async function claimSalary() {
    txLoading = true;
    const id = toast.loading('Claiming salary…');
    try {
      const tx = await writeContractWithGas({ address: HUB, abi: arizeBizHubAbi, functionName: 'claimSalary', args: [] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('Salary claimed!', { id }); await loadData();
    } catch (e: unknown) { toast.error(parseContractError(e), { id }); }
    finally { txLoading = false; }
  }

  let lastAddr = '';
  $: if ($address && $address !== lastAddr) { lastAddr = $address; loadData(); }
  $: if (!$isConnected) { lastAddr = ''; loading = false; userId = 0n; isRegistered = false; }

  onMount(async () => {
    await initWeb3();
    if ($isConnected && $address) loadData();
  });
</script>

<svelte:head>
  <title>Dashboard — ArizeBiz</title>
</svelte:head>

<div class="min-h-screen" style="background:var(--color-surface)">

  {#if !$isConnected}
    <!-- ── Full-page: Not Connected ── -->
    <div class="flex min-h-screen items-center justify-center px-4">
      <div class="card gold-border w-full max-w-sm p-10 text-center">
        <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
             style="background:rgba(247,159,31,0.1);box-shadow:0 0 40px rgba(245,158,11,0.15)">
          <svg class="h-10 w-10" style="color:#f59e0b" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <h2 class="mb-2 text-xl font-bold text-text-primary">Connect Your Wallet</h2>
        <p class="mb-6 text-sm text-text-muted">Connect your wallet to access the dashboard</p>
        <div class="flex justify-center">
          <WalletButton size="lg" />
        </div>
      </div>
    </div>

  {:else if loading}
    <!-- ── Full-page: Loading ── -->
    <div class="flex min-h-screen items-center justify-center">
      <div class="gold-text animate-pulse text-xl">Loading…</div>
    </div>

  {:else if !isRegistered}
    <!-- ── Full-page: Not Registered ── -->
    <div class="flex min-h-screen items-center justify-center px-4">
      <div class="card w-full max-w-sm p-10 text-center">
        <div class="mb-4 text-5xl">🚀</div>
        <h2 class="mb-2 text-xl font-bold text-text-primary">Not Registered</h2>
        <p class="mb-6 text-sm text-text-muted">This wallet is not registered yet.</p>
        <a href="/register" class="btn-primary px-8 py-3 text-base">Go to Register</a>
        <div class="mt-4 flex justify-center">
          <WalletButton size="sm" />
        </div>
      </div>
    </div>

  {:else if error}
    <!-- ── Full-page: Error ── -->
    <div class="flex min-h-screen items-center justify-center px-4">
      <div class="card w-full max-w-sm p-8 text-center text-error">{error}</div>
    </div>

  {:else}
    <!-- ── Full dashboard (connected + registered) ── -->
    <header class="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3">
      <a href="/" class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black"
             style="background:linear-gradient(135deg,#f59e0b,#d97706)">AB</div>
        <span class="font-bold">Arize<span class="gold-text">Biz</span></span>
      </a>
      <div class="flex items-center gap-2">
        <button on:click={() => loadData()} class="btn-outline px-3 py-1.5 text-xs" title="Refresh">↻</button>
        <WalletButton size="sm" />
      </div>
    </header>

    <div class="mx-auto max-w-5xl px-4 py-6 pb-20">
      <!-- User info bar -->
      <div class="mb-5 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <span class="rounded-full border border-border px-3 py-1 font-medium text-gold"
              style="background:var(--color-gold-dim)">AB{userId}</span>
        <span class="rounded-full border border-border px-3 py-1" style="background:var(--color-surface-3)">
          Referrer AB{user.referrerId}
        </span>
        <span class="rounded-full border border-border px-3 py-1" style="background:var(--color-surface-3)">
          {user.directCount} Directs
        </span>
        <span class="rounded-full border border-border px-3 py-1" style="background:var(--color-surface-3)">
          Level {openLevel} Open
        </span>
      </div>

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

      <!-- ── Tab components ─────────────────────────────────── -->
      {#if activeTab === 'overview'}
        <OverviewTab {income} {user} {txLoading}
          on:claimROI={claimROI} />

      {:else if activeTab === 'earnings'}
        <EarningsTab {income} {txLoading} {withdrawFee}
          on:checkRank={checkRank}
          on:claimSalary={claimSalary}
          on:withdraw={(e) => handleWithdraw(e.detail.amount)} />

      {:else if activeTab === 'packages'}
        <PackagesTab {packages} {workingMult} {dayLength} {txLoading} on:claimROI={claimROI} />

      {:else if activeTab === 'team'}
        <TeamTab userId={user.userId} directCount={user.directCount} {team} userAddress={$address ?? ''} />

      {:else if activeTab === 'bonanza'}
        <BonanzaTab userAddress={$address ?? ''} userId={Number(userId)} salaryAmount={income.totalSalary} {txLoading}
          on:refresh={loadData}
          on:checkRank={checkRank}
          on:claimSalary={claimSalary} />
      {/if}
    </div>

    <DashboardNav activeTab={activeTab} onTabChange={(t) => activeTab = t as Tab} />
  {/if}

</div>
