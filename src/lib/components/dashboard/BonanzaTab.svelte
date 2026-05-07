<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { readContract, wagmiConfig } from '$lib/web3/store';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits } from 'viem';

  export let userAddress: string = '';
  export let userId:      number = 0;
  export let salaryAmount: bigint = 0n;
  export let txLoading   = false;
  export let readonly    = false;

  const dispatch = createEventDispatcher<{ refresh: void; checkRank: void; claimSalary: void }>();

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  // ── Rank salary slots ─────────────────────────────────────
  interface RankSlot {
    rank: number;
    target: string;
    perDay: bigint;
    salaryPerDay: bigint;
    qualifiedAt: number;
    expiry: number;
    lastClaimed: number;
    active: boolean;
    pendingDays: number;
  }
  const RANK_TARGETS = ['$5,000', '$15,000', '$55,000', '$1,55,000', '$6,55,000', '$26,55,000'];
  const RANK_PERDAY  = [5n * BigInt(1e18), 10n * BigInt(1e18), 40n * BigInt(1e18), 100n * BigInt(1e18), 500n * BigInt(1e18), 2000n * BigInt(1e18)];

  let rankSlots: RankSlot[] = [];
  let rankLoading = false;

  async function loadRankSalaries() {
    if (!userId) return;
    rankLoading = true;
    try {
      const raw = await readContract(wagmiConfig, {
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'getRankSalaries', args: [userId],
      }) as unknown as Array<{ salaryPerDay: bigint; qualifiedAt: number; expiry: number; lastClaimed: number }>;
      const now = Math.floor(Date.now() / 1000);
      rankSlots = raw.map((s, i) => {
        const active = s.salaryPerDay > 0n && now < Number(s.expiry);
        const pendingDays = active
          ? Math.floor((Math.min(now, Number(s.expiry)) - Number(s.lastClaimed)) / 86400)
          : 0;
        return {
          rank: i + 1,
          target: RANK_TARGETS[i],
          perDay: RANK_PERDAY[i],
          salaryPerDay: s.salaryPerDay,
          qualifiedAt: Number(s.qualifiedAt),
          expiry: Number(s.expiry),
          lastClaimed: Number(s.lastClaimed),
          active,
          pendingDays,
        };
      });
    } catch { /* ignore */ }
    rankLoading = false;
  }

  $: if (userId) loadRankSalaries();

  interface Bonanza {
    id: bigint;
    name: string;
    startDate: number;
    endDate: number;
    active: boolean;
    teamTargets: bigint[];
    rewardAmounts: bigint[];
    qualified: boolean;
    qualifiedTier: number;
    rewardAmount: bigint;
  }

  let bonanzas: Bonanza[] = [];
  let loading = false;
  let checked = false;

  function fmt(val: bigint, dec = 18) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  function fmtDate(ts: number) {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  async function loadBonanzas() {
    loading = true; bonanzas = [];
    try {
      const count = await readContract(wagmiConfig, {
        address: PROXY, abi: arizeBizV2Abi, functionName: 'bonanzaCount', args: [],
      }) as unknown as bigint;

      for (let id = 1n; id <= count; id++) {
        try {
          const b = await readContract(wagmiConfig, {
            address: PROXY, abi: arizeBizV2Abi, functionName: 'getBonanza', args: [id],
          }) as unknown as { name: string; startDate: number; endDate: number; active: boolean; teamTargets: bigint[]; rewardAmounts: bigint[] };

          let qualifiedTier = -1;
          let rewardAmount  = 0n;
          if (userAddress) {
            try {
              const q = await readContract(wagmiConfig, {
                address: PROXY, abi: arizeBizV2Abi,
                functionName: 'checkBonanzaQualification',
                args: [id, userAddress as `0x${string}`],
              }) as unknown as { qualifiedTier: bigint; rewardAmount: bigint };
              qualifiedTier = Number(q.qualifiedTier);
              rewardAmount  = q.rewardAmount;
            } catch { /* ignore */ }
          }

          bonanzas = [...bonanzas, {
            id, name: b.name, startDate: b.startDate, endDate: b.endDate,
            active: b.active, teamTargets: b.teamTargets, rewardAmounts: b.rewardAmounts,
            qualified: qualifiedTier >= 0, qualifiedTier, rewardAmount,
          }];
        } catch { /* skip */ }
      }
    } catch { /* ignore */ }
    finally { loading = false; checked = true; }
  }
</script>

<div class="space-y-5">

  <!-- Reward / Rank Rewards -->
  <div class="card p-5" style="border-color:rgba(167,139,250,0.3)">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h3 class="font-bold text-text-primary">Rank Rewards</h3>
        <p class="text-xs text-text-muted mt-0.5">6 parallel ranks — all qualifying tiers active simultaneously</p>
      </div>
      <div class="text-right">
        <p class="text-xs text-text-muted">Total Earned</p>
        <p class="text-lg font-bold" style="color:#a78bfa">${fmt(salaryAmount)}</p>
      </div>
    </div>

    {#if rankLoading}
      <div class="flex h-16 items-center justify-center">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"></div>
      </div>
    {:else if rankSlots.length > 0}
      <div class="space-y-2 mb-4">
        {#each rankSlots as s}
          <div class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
               style="background:var(--color-surface-3); border:1px solid {s.active ? 'rgba(167,139,250,0.4)' : 'transparent'}">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style="background:{s.active ? 'rgba(167,139,250,0.2)' : 'var(--color-surface-2)'}; color:{s.active ? '#a78bfa' : '#666'}">
                {s.rank}
              </span>
              <div>
                <p class="text-xs text-text-muted">Biz ≥ {s.target}</p>
                <p class="font-bold" style="color:{s.active ? '#a78bfa' : 'var(--color-text-muted)'}">
                  ${fmt(s.perDay)}/day
                </p>
              </div>
            </div>
            <div class="text-right">
              {#if s.active}
                <p class="text-xs font-bold" style="color:#36FF6F">● Active</p>
                <p class="text-xs text-text-muted">{s.pendingDays}d claimable</p>
                <p class="text-xs text-text-muted">Exp: {new Date(s.expiry * 1000).toLocaleDateString('en-IN')}</p>
              {:else if s.salaryPerDay > 0n && s.expiry > 0}
                <p class="text-xs font-bold text-text-muted">○ Expired</p>
                <p class="text-xs text-text-muted">{new Date(s.expiry * 1000).toLocaleDateString('en-IN')}</p>
                <p class="text-xs" style="color:#f59e0b">Re-qualify to restart</p>
              {:else}
                <p class="text-xs text-text-muted">Not achieved yet</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if !readonly}
    <div class="flex gap-3">
      <button on:click={() => { dispatch('checkRank'); loadRankSalaries(); }} disabled={txLoading}
              class="btn-outline flex-1 py-2.5 text-sm">
        {txLoading ? '…' : 'Check Rank'}
      </button>
      <button on:click={() => dispatch('claimSalary')} disabled={txLoading}
              class="btn-primary flex-1 py-2.5 text-sm">
        {txLoading ? 'Processing…' : 'Claim Rewards'}
      </button>
    </div>
    {/if}
  </div>

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="font-bold gold-text">Bonanza Events</h3>
      <p class="text-xs text-text-muted mt-0.5">Admin-created reward competitions</p>
    </div>
    <button on:click={loadBonanzas} disabled={loading} class="btn-outline px-4 py-2 text-sm">
      {loading ? '…' : 'Check Status'}
    </button>
  </div>

  {#if !checked}
    <!-- Not yet loaded -->
    <div class="card p-12 text-center">
      <div class="mb-4 text-5xl">🏆</div>
      <h4 class="mb-1 font-bold gold-text">Bonanza Rewards</h4>
      <p class="mb-5 text-sm text-text-secondary">
        Compete in admin-created bonanza events to win USDT rewards.
        Top performers in team building win big!
      </p>
      <button on:click={loadBonanzas} class="btn-primary px-8 py-3">
        Check Active Events
      </button>
    </div>

  {:else if loading}
    <div class="flex h-48 items-center justify-center gold-text animate-pulse">
      Loading events…
    </div>

  {:else if bonanzas.length === 0}
    <div class="card p-12 text-center">
      <div class="mb-3 text-4xl">🔍</div>
      <p class="text-text-secondary">No bonanza events found.</p>
      <p class="mt-1 text-xs text-text-muted">Check back later for new events.</p>
    </div>

  {:else}
    {#each bonanzas as b}
      {@const now = Math.floor(Date.now() / 1000)}
      {@const isLive = b.active && now >= b.startDate && now <= b.endDate}
      {@const isUpcoming = b.active && now < b.startDate}

      <div class="card p-5 {b.qualified ? 'gold-border' : ''}">
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <span class="font-bold text-text-primary">{b.name}</span>
            <div class="mt-0.5 flex gap-2 text-xs text-text-muted">
              <span>{fmtDate(b.startDate)}</span>
              <span>→</span>
              <span>{fmtDate(b.endDate)}</span>
            </div>
          </div>
          <span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold
                       {isLive ? 'text-success' : isUpcoming ? 'text-gold' : 'text-text-muted'}"
                style="{isLive
                  ? 'background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3)'
                  : isUpcoming
                    ? 'background:var(--color-gold-dim);border:1px solid var(--color-border-strong)'
                    : 'background:var(--color-surface-3)'}">
            {isLive ? '● Live' : isUpcoming ? '⏳ Upcoming' : '○ Ended'}
          </span>
        </div>

        <!-- Tiers -->
        <div class="mb-3 space-y-1.5">
          {#each b.teamTargets as target, ti}
            <div class="flex items-center justify-between rounded-xl px-3 py-2 text-sm
                        {b.qualifiedTier === ti ? 'border border-gold' : ''}"
                 style="background:var(--color-surface-3)">
              <span class="text-text-muted">Tier {ti + 1}: ${fmt(target)} team biz</span>
              <span class="font-semibold gold-text">Win ${fmt(b.rewardAmounts[ti])}</span>
            </div>
          {/each}
        </div>

        {#if b.qualified}
          <div class="rounded-xl px-4 py-3 text-sm font-semibold text-center"
               style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#22c55e">
            🎉 Qualified — Tier {b.qualifiedTier + 1} · Reward: ${fmt(b.rewardAmount)}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
