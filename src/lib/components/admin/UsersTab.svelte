<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { readContract, wagmiConfig } from '$lib/web3/store';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits } from 'viem';
  import type { LookupResult } from '$lib/types/admin';

  const dispatch = createEventDispatcher<{ txStatus: { msg: string; err: boolean } }>();
  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  let lookupId     = '';
  let lookupAddr   = '';
  let result: LookupResult | null = null;
  let loading = false;

  function fmt(val: bigint, dec = 18) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  async function lookup() {
    if (!lookupId && !lookupAddr) {
      dispatch('txStatus', { msg: 'Enter an ID or address', err: true }); return;
    }
    loading = true; result = null;
    try {
      let id: bigint;
      if (lookupAddr.startsWith('0x')) {
        id = await readContract(wagmiConfig, {
          address: PROXY, abi: arizeBizV2Abi,
          functionName: 'addrToId', args: [lookupAddr as `0x${string}`],
        }) as unknown as bigint;
      } else {
        id = BigInt(lookupId || '0');
      }
      if (id === 0n) {
        dispatch('txStatus', { msg: 'User not found', err: true }); loading = false; return;
      }

      const addr = await readContract(wagmiConfig, {
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'idToAddr', args: [Number(id)],
      }) as unknown as string;

      const [income, info] = await Promise.all([
        readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'incomeInfo', args: [Number(id)] }),
        readContract(wagmiConfig, { address: PROXY, abi: arizeBizV2Abi, functionName: 'userInfo',   args: [Number(id)] }),
      ]);

      result = {
        id, addr,
        income: income as unknown as LookupResult['income'],
        info:   info   as unknown as [number, boolean, bigint],
      };
    } catch (e: unknown) {
      dispatch('txStatus', { msg: e instanceof Error ? e.message : 'Lookup failed', err: true });
    } finally { loading = false; }
  }
</script>

<div class="space-y-5">
  <!-- Search bar -->
  <div class="card p-5">
    <h3 class="mb-4 font-bold gold-text">User Lookup</h3>
    <div class="flex flex-wrap gap-3">
      <input type="text" bind:value={lookupAddr} placeholder="Wallet address (0x…)"
        class="flex-1 min-w-[200px] rounded-xl border border-border px-3 py-2.5 text-sm
               text-text-primary outline-none focus:border-gold"
        style="background:var(--color-surface-3)" />
      <span class="self-center text-text-muted text-sm">or</span>
      <input type="number" bind:value={lookupId} placeholder="User ID"
        class="w-28 rounded-xl border border-border px-3 py-2.5 text-sm
               text-text-primary outline-none focus:border-gold"
        style="background:var(--color-surface-3)" />
      <button on:click={lookup} disabled={loading}
              class="btn-primary px-5 py-2.5 text-sm whitespace-nowrap">
        {loading ? 'Searching…' : 'Search'}
      </button>
    </div>
  </div>

  <!-- Result -->
  {#if result}
    {@const r = result}
    <div class="card p-5 space-y-4">
      <!-- Identity -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-full px-3 py-1 text-sm font-bold gold-text"
              style="background:var(--color-gold-dim)">
          ID #{r.id}
        </span>
        <span class="rounded-full px-3 py-1 font-mono text-xs text-text-secondary"
              style="background:var(--color-surface-3)">
          {r.addr}
        </span>
        <span class="rounded-full px-3 py-1 text-xs text-text-muted"
              style="background:var(--color-surface-3)">
          Ref #{r.info[0]} · {r.info[2]} directs
        </span>
        <span class="rounded-full px-3 py-1 text-xs font-semibold
                     {r.info[1] ? 'text-success' : 'text-error'}"
              style="background:{r.info[1]
                ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
          {r.info[1] ? 'Registered' : 'Not Registered'}
        </span>
      </div>

      <!-- Income grid -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {#each [
          { k:'Available',  v:`$${fmt(r.income.availableBalance)}`, c:'#f59e0b' },
          { k:'Total ROI',  v:`$${fmt(r.income.totalRoi)}`,         c:'#22c55e' },
          { k:'Referral',   v:`$${fmt(r.income.totalReferral)}`,    c:'#3b82f6' },
          { k:'Level',      v:`$${fmt(r.income.totalLevel)}`,       c:'#e2e8f0' },
          { k:'Salary',     v:`$${fmt(r.income.totalSalary)}`,      c:'#a78bfa' },
          { k:'Withdrawn',  v:`$${fmt(r.income.totalWithdrawn)}`,   c:'#6b7280' },
        ] as f}
          <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
            <div class="text-xs text-text-muted">{f.k}</div>
            <div class="mt-0.5 font-semibold text-sm" style="color:{f.c}">{f.v}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
