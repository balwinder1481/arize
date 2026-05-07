<script lang="ts">
  import { onMount } from 'svelte';
  import { readContract, writeContractWithGas, waitForTransactionReceipt } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits } from 'viem';
  import { toast } from 'svelte-sonner';
  import UserDetailPanel from './UserDetailPanel.svelte';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  // ── Pagination ────────────────────────────────────────────
  const PER_PAGE = 10;
  let totalUsers    = 0;
  let currentPage   = 0;
  let loadingList   = true;
  let userAddrs: string[] = [];

  $: totalPages = Math.ceil(totalUsers / PER_PAGE);
  $: pageStart  = currentPage * PER_PAGE;
  $: pageEnd    = Math.min(pageStart + PER_PAGE, totalUsers);

  // ── Search ────────────────────────────────────────────────
  let searchInput   = '';
  let searchResult: UserDetail | null = null;
  let searchLoading = false;
  let searchError   = '';

  // ── Expand ────────────────────────────────────────────────
  let expandedIndex: number | null = null;
  let expandedDetails: Record<number, UserDetail | null> = {};
  let expandedLoading: Record<number, boolean> = {};

  // ── Types ─────────────────────────────────────────────────
  interface UserDetail {
    address: string;
    uid: number;
    referrerId: number;
    isRegistered: boolean;
    directReferrals: number;
    availableBalance: bigint;
    totalWithdrawn: bigint;
    totalRoi: bigint;
    totalReferral: bigint;
    totalLevel: bigint;
    packages: PkgDetail[];
  }
  interface PkgDetail {
    idx: number; amount: bigint; used: bigint; roiUsed: bigint;
    startTime: number; daysClaimed: number; dailyRoi: number;
    isActive: boolean; packageType: number;
  }

  // ── Helpers ───────────────────────────────────────────────
  function fmt(v: bigint | undefined) {
    if (v === undefined || v === null) return '$0.00';
    return '$' + Number(formatUnits(v, 18)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function short(a: string) { return a.slice(0, 6) + '…' + a.slice(-4); }

  async function getUid(addr: string): Promise<number> {
    return Number(await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [addr as `0x${string}`] }));
  }
  async function getAddr(uid: number): Promise<string> {
    return await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'idToAddr', args: [uid] }) as string;
  }

  async function loadUserDetail(addr: string): Promise<UserDetail | null> {
    try {
      const uid = await getUid(addr);
      if (!uid) return null;
      const [ui, ii] = await Promise.all([
        readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'userInfo',   args: [uid] }),
        readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'incomeInfo', args: [uid] }),
      ]);
      const uiData = ui as any;
      const iiData = ii as any;

      // Load packages (up to 20)
      const pkgs: PkgDetail[] = [];
      for (let i = 0; i < 20; i++) {
        try {
          const p = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'packages', args: [uid, BigInt(i)] }) as any;
          if (!p || !p[0] || p[0] === 0n) break;
          pkgs.push({ idx: i, amount: p[0], used: p[1], roiUsed: p[2], startTime: Number(p[3]), daysClaimed: Number(p[4]), dailyRoi: Number(p[5]), isActive: p[6], packageType: Number(p[7]) });
        } catch { break; }
      }

      return {
        address: addr, uid,
        referrerId: Number(uiData[0] ?? 0),
        isRegistered: uiData[1] ?? false,
        directReferrals: Number(uiData[2] ?? 0),
        availableBalance: iiData[0] ?? 0n,
        totalWithdrawn:   iiData[1] ?? 0n,
        totalRoi:         iiData[2] ?? 0n,
        totalReferral:    iiData[3] ?? 0n,
        totalLevel:       iiData[4] ?? 0n,
        packages: pkgs,
      };
    } catch { return null; }
  }

  // ── Load page ─────────────────────────────────────────────
  async function loadPage() {
    loadingList = true;
    try {
      totalUsers = Number(await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'totalUsers', args: [] }));
      const addrs: string[] = [];
      for (let i = pageStart; i < Math.min(pageStart + PER_PAGE, totalUsers); i++) {
        try {
          const uid = Number(await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'allUserIds', args: [BigInt(i)] }));
          const addr = await getAddr(uid);
          addrs.push(addr);
        } catch { addrs.push(''); }
      }
      userAddrs = addrs;
      expandedIndex = null;
      expandedDetails = {};
    } catch { /* ignore */ }
    finally { loadingList = false; }
  }

  async function handleSearch() {
    if (!searchInput || !searchInput.startsWith('0x') || searchInput.length !== 42) {
      searchError = 'Enter a valid address (0x...)'; return;
    }
    searchLoading = true; searchError = '';
    searchResult = await loadUserDetail(searchInput);
    if (!searchResult) searchError = 'User not found or not registered';
    searchLoading = false;
  }

  async function toggleExpand(idx: number, addr: string) {
    if (expandedIndex === idx) { expandedIndex = null; return; }
    expandedIndex = idx;
    if (!expandedDetails[idx]) {
      expandedLoading = { ...expandedLoading, [idx]: true };
      expandedDetails[idx] = await loadUserDetail(addr);
      expandedLoading = { ...expandedLoading, [idx]: false };
    }
  }

  // ── Address Migration ─────────────────────────────────────
  let migrateFor   = '';
  let migrateNew   = '';
  let migrateModal = false;
  let migrateBusy  = false;
  let migrateErr   = '';

  async function doMigrate() {
    if (!migrateNew.startsWith('0x') || migrateNew.length !== 42) {
      migrateErr = 'Invalid address'; return;
    }
    migrateBusy = true; migrateErr = '';
    try {
      const tx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'changeWallet',
        args: [migrateFor as `0x${string}`, migrateNew as `0x${string}`],
      });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      migrateModal = false; migrateFor = migrateNew = '';
      toast.success('Address migrated successfully! ✓');
      await loadPage();
    } catch (e: unknown) { migrateErr = e instanceof Error ? e.message : 'Migration failed'; }
    finally { migrateBusy = false; }
  }

  $: if (currentPage >= 0) loadPage();
  onMount(async () => { await initWeb3(); loadPage(); });
</script>

<!-- Migrate Modal -->
{#if migrateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div class="card w-full max-w-md p-6">
      <h3 class="mb-4 text-lg font-bold text-amber-400">⚠ Migrate User Address</h3>
      <div class="mb-3 rounded-xl border border-border px-3 py-2 text-xs text-text-muted" style="background:var(--color-surface-3)">
        <span class="text-text-muted">Old:</span> <span class="ml-1 font-mono text-text-primary">{migrateFor}</span>
      </div>
      <input bind:value={migrateNew} type="text" placeholder="New Address (0x...)"
             class="mb-3 w-full rounded-xl border border-border px-3 py-2 font-mono text-sm outline-none"
             style="background:var(--color-surface-3); color:var(--color-text-primary)" />
      {#if migrateErr}<p class="mb-2 text-xs text-error">{migrateErr}</p>{/if}
      <div class="flex gap-3">
        <button on:click={() => migrateModal = false} class="flex-1 btn-outline py-2 text-sm">Cancel</button>
        <button on:click={doMigrate} disabled={migrateBusy}
                class="flex-1 rounded-xl py-2 text-sm font-bold text-black disabled:opacity-50"
                style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
          {migrateBusy ? '…' : 'Confirm Migrate'}
        </button>
      </div>
    </div>
  </div>
{/if}


<div class="space-y-6">

  <!-- Header -->
  <div class="flex flex-wrap items-center gap-3">
    <svg class="h-6 w-6" style="color:#36FF6F" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    <h2 class="text-xl font-bold text-text-primary">User Management</h2>
    <span class="ml-auto rounded-xl px-3 py-1 text-sm font-bold" style="background:var(--color-surface-3); color:#00FFE7">
      {totalUsers} users
    </span>
  </div>

  <!-- Search -->
  <div class="card p-4">
    <div class="flex gap-3">
      <input bind:value={searchInput} type="text" placeholder="Search by wallet address (0x...)"
             on:keydown={(e) => e.key === 'Enter' && handleSearch()}
             class="flex-1 rounded-xl border border-border px-4 py-2.5 font-mono text-sm outline-none transition-colors focus:border-amber-400"
             style="background:var(--color-surface-3); color:var(--color-text-primary)" />
      <button on:click={handleSearch} disabled={searchLoading}
              class="rounded-xl px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
              style="background:linear-gradient(135deg,#00FFE7,#1762FF)">
        {searchLoading ? '…' : '🔍'}
      </button>
    </div>
    {#if searchError}<p class="mt-2 text-xs text-error">{searchError}</p>{/if}
  </div>

  <!-- Search Result -->
  {#if searchResult}
    <div class="card overflow-hidden p-0" style="border-color:rgba(0,255,231,0.3)">
      <div class="flex w-full items-center justify-between px-4 py-3"
           style="background:rgba(0,255,231,0.05)">
        <button class="flex-1 text-left" on:click={() => searchResult = null}>
          <p class="text-xs text-text-muted">Search Result — click to close</p>
          <p class="font-mono text-sm text-text-primary">{searchResult.address}</p>
        </button>
        <div class="flex items-center gap-2">
          <a href="/user?addr={searchResult.address}" target="_blank" rel="noreferrer"
             class="rounded-lg px-2.5 py-1 text-xs font-bold transition-colors hover:opacity-80"
             style="background:rgba(247,159,31,0.15);color:#f59e0b;border:1px solid rgba(247,159,31,0.3)">
            View ↗
          </a>
          <button on:click={() => searchResult = null} class="text-text-muted text-lg px-1">✕</button>
        </div>
      </div>
      <UserDetailPanel detail={searchResult}
        on:migrate={(e: CustomEvent<{old: string; newAddr: string}>) => { migrateFor = e.detail.old; migrateNew = e.detail.newAddr; migrateModal = true; }}
         />
    </div>
  {/if}

  <!-- User List -->
  <div>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="font-bold text-text-primary">All Users ({totalUsers})</h3>
      <span class="text-xs text-text-muted">Page {currentPage + 1} of {totalPages || 1}</span>
    </div>

    {#if loadingList}
      <div class="flex h-32 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    {:else}
      <div class="space-y-2">
        {#each userAddrs as addr, idx}
          {@const absIdx = pageStart + idx}
          <div class="card overflow-hidden p-0" style="border-color:{expandedIndex === absIdx ? 'rgba(0,255,231,0.4)' : 'var(--color-border)'}">
            <!-- Row -->
            <button class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
                 on:click={() => toggleExpand(absIdx, addr)}>
              <div>
                <p class="text-xs text-text-muted">User #{absIdx + 1}</p>
                <p class="font-mono text-sm text-text-primary">{addr ? short(addr) : '…'}</p>
              </div>
              <div class="flex items-center gap-3">
                {#if expandedDetails[absIdx]}
                  <div class="text-right">
                    <p class="text-xs text-text-muted">ROI Earned</p>
                    <p class="text-sm font-bold" style="color:#00FFE7">{fmt(expandedDetails[absIdx]?.totalRoi ?? 0n)}</p>
                  </div>
                {/if}
                <a href="/user?addr={addr}" target="_blank" rel="noreferrer"
                   on:click|stopPropagation
                   class="rounded-lg px-2.5 py-1 text-xs font-bold transition-colors hover:opacity-80"
                   style="background:rgba(247,159,31,0.15);color:#f59e0b;border:1px solid rgba(247,159,31,0.3)">
                  View ↗
                </a>
                <span class="text-text-muted">{expandedIndex === absIdx ? '▲' : '▼'}</span>
              </div>
            </button>

            <!-- Expanded -->
            {#if expandedIndex === absIdx}
              {#if expandedLoading[absIdx]}
                <div class="flex h-16 items-center justify-center border-t border-border">
                  <div class="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                </div>
              {:else if expandedDetails[absIdx]}
                <UserDetailPanel detail={expandedDetails[absIdx]!}
                  on:migrate={(e: CustomEvent<{old: string; newAddr: string}>) => { migrateFor = e.detail.old; migrateNew = e.detail.newAddr; migrateModal = true; }} />
              {/if}
            {/if}
          </div>
        {/each}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="mt-4 flex items-center justify-center gap-3">
          <button on:click={() => currentPage = Math.max(0, currentPage - 1)}
                  disabled={currentPage === 0}
                  class="rounded-xl border border-border px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-amber-400/10 disabled:opacity-30">
            ← Prev
          </button>
          <span class="text-sm text-text-muted">{currentPage + 1} / {totalPages}</span>
          <button on:click={() => currentPage = Math.min(totalPages - 1, currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  class="rounded-xl border border-border px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-amber-400/10 disabled:opacity-30">
            Next →
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

