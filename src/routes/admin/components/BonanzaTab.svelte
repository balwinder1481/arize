<script lang="ts">
  import { onMount } from 'svelte';
  import { readContract, writeContractWithGas, waitForTransactionReceipt } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { formatUnits } from 'viem';
  import { toast } from 'svelte-sonner';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  // ── State ─────────────────────────────────────────────────
  let bonanzaCount = 0;
  let selectedId   = 0;
  let totalUsers   = 0;
  let loading      = true;
  let busy         = false;
  let metaError    = '';

  interface Bonanza {
    name: string; startDate: number; endDate: number; active: boolean;
    directTargets: bigint[]; teamTargets: bigint[]; rewardAmounts: bigint[];
    tierCount: number;
  }
  let bonanza: Bonanza | null = null;
  let bonanzaLoading = false;

  // ── Qualified users ───────────────────────────────────────
  interface QualUser {
    address: string; uid: number;
    tierIndex: number; rewardAmount: bigint;
    power: bigint; weaker: bigint; weakest: bigint;
    isPaid: boolean;
  }
  let qualUsers: QualUser[] = [];
  let qualLoading = false;
  let qualProgress = 0;

  // ── Salary earners ───────────────────────────────────────────
  interface SalaryEarner {
    address: string; uid: number;
    rank: number; salaryPerDay: bigint;
    expiry: number; pendingDays: number;
  }
  let salaryEarners: SalaryEarner[] = [];
  let salaryLoading = false;
  let salaryProgress = 0;

  // ── Edit mode ─────────────────────────────────────────────
  let isEditing   = false;
  let editStart   = '';
  let editEnd     = '';
  let editActive  = true;
  interface EditTier { direct: string; team: string; reward: string; }
  let editTiers: EditTier[] = [];

  // ── Helpers ───────────────────────────────────────────────
  function fmt(v: bigint) { return '$' + Number(formatUnits(v, 18)).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  function setStatus(msg: string, err = false) { if (err) toast.error(msg); else toast.success(msg); }
  function short(a: string) { return a.slice(0, 6) + '…' + a.slice(-4); }

  function dateToIST(ts: number) {
    return new Date((ts + 5.5 * 3600) * 1000).toLocaleString('en-IN', {
      year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12: true
    });
  }
  function dtLocalToUTC(s: string) {
    const d = new Date(s);
    return Math.floor(d.getTime() / 1000);
  }
  function tsToLocal(ts: number) {
    return new Date(ts * 1000).toISOString().slice(0, 16);
  }

  // ── Load bonanza count + total users ─────────────────────
  async function loadMeta() {
    loading = true;
    try {
      const wc = getWagmiConfig()!;
      const [bc, tu] = await Promise.all([
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'bonanzaCount' }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'totalUsers' }),
      ]);
      bonanzaCount = Number(bc);
      totalUsers   = Number(tu);
    } catch (e: unknown) { metaError = e instanceof Error ? e.message : String(e); }
    loading = false;
    if (bonanzaCount > 0) await loadBonanza(selectedId);
  }

  async function loadBonanza(id: number) {
    bonanzaLoading = true; bonanza = null;
    try {
      const raw = await readContract(getWagmiConfig()!, {
        address: PROXY, abi: arizeBizV2Abi, functionName: 'getBonanza', args: [BigInt(id)],
      }) as unknown as [string, number, number, boolean, bigint[], bigint[], bigint[]];
      bonanza = {
        name:          raw[0],
        startDate:     Number(raw[1]),
        endDate:       Number(raw[2]),
        active:        raw[3],
        directTargets: [...raw[4]],
        teamTargets:   [...raw[5]],
        rewardAmounts: [...raw[6]],
        tierCount:     raw[4].length,
      };
    } catch (e: unknown) { toast.error('Failed to load bonanza: ' + (e instanceof Error ? e.message : String(e))); }
    bonanzaLoading = false;
  }

  async function selectBonanza(id: number) {
    selectedId = id; isEditing = false;
    await loadBonanza(id);
    if (bonanza?.active) loadQualifiedUsers();
  }

  // ── Salary earners scan ──────────────────────────────────────
  async function loadSalaryEarners() {
    salaryEarners = []; salaryLoading = true; salaryProgress = 0;
    const found: SalaryEarner[] = [];
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < totalUsers; i++) {
      try {
        const uid  = Number(await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'allUserIds', args: [BigInt(i)] }));
        const addr = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'idToAddr', args: [uid] }) as string;
        const slots = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'getRankSalaries', args: [uid] }) as unknown as Array<{ salaryPerDay: bigint; qualifiedAt: number; expiry: number; lastClaimed: number }>;
        for (let r = 0; r < 6; r++) {
          const s = slots[r];
          if (s.salaryPerDay > 0n && now < Number(s.expiry)) {
            const pendingDays = Math.floor((Math.min(now, Number(s.expiry)) - Number(s.lastClaimed)) / 86400);
            found.push({ address: addr, uid, rank: r + 1, salaryPerDay: s.salaryPerDay, expiry: Number(s.expiry), pendingDays });
          }
        }
      } catch { /* skip */ }
      salaryProgress = Math.round(((i + 1) / totalUsers) * 100);
    }
    salaryEarners = found; salaryLoading = false;
  }

  // ── Qualified users scan ──────────────────────────────────
  async function loadQualifiedUsers() {
    qualUsers = []; qualLoading = true; qualProgress = 0;
    const found: QualUser[] = [];
    for (let i = 0; i < totalUsers; i++) {
      try {
        const uid  = Number(await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'allUserIds',  args: [BigInt(i)] }));
        const addr = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'idToAddr',     args: [uid] }) as string;
        const res  = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'checkBonanzaQualification', args: [BigInt(selectedId), addr as `0x${string}`] }) as unknown as [bigint, bigint, bigint, bigint, bigint];
        const tierIndex = Number(res[0]);
        if (tierIndex >= 0) {
          const isPaid = Boolean(await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'bonanzaIsPaid', args: [BigInt(selectedId), uid] }));
          found.push({ address: addr, uid, tierIndex, rewardAmount: res[1], power: res[2], weaker: res[3], weakest: res[4], isPaid });
        }
      } catch { /* skip */ }
      qualProgress = Math.round(((i + 1) / totalUsers) * 100);
    }
    qualUsers = found; qualLoading = false;
  }

  // ── Pay bonanza ───────────────────────────────────────────
  async function payUser(addr: string) {
    if (!confirm(`Pay bonanza reward to ${addr}?`)) return;
    busy = true;
    const id = toast.loading('Paying reward…');
    try {
      const tx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'payBonanza',
        args: [BigInt(selectedId), addr as `0x${string}`],
      });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('Reward paid ✓', { id });
      await loadQualifiedUsers();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed', { id }); }
    finally { busy = false; }
  }

  // ── Edit mode ─────────────────────────────────────────────
  function startEdit() {
    if (!bonanza) return;
    editStart  = tsToLocal(bonanza.startDate);
    editEnd    = tsToLocal(bonanza.endDate);
    editActive = bonanza.active;
    editTiers  = bonanza.directTargets.map((_, i) => ({
      direct: (Number(bonanza!.directTargets[i]) / 1e18).toString(),
      team:   (Number(bonanza!.teamTargets[i])   / 1e18).toString(),
      reward: (Number(bonanza!.rewardAmounts[i]) / 1e18).toString(),
    }));
    isEditing = true;
  }

  function addEditTier() { editTiers = [...editTiers, { direct: '', team: '', reward: '' }]; }
  function removeEditTier(i: number) { if (editTiers.length > 1) editTiers = editTiers.filter((_, j) => j !== i); }
  function updateEditTier(i: number, field: keyof EditTier, v: string) {
    const t = [...editTiers]; t[i][field] = v; editTiers = t;
  }

  async function saveEdit() {
    if (!editStart || !editEnd) { toast.error('Select dates'); return; }
    if (editTiers.some(t => !t.direct || !t.team || !t.reward)) { toast.error('Fill all tier fields'); return; }
    busy = true;
    const id = toast.loading('Updating bonanza…');
    try {
      const st = dtLocalToUTC(editStart);
      const et = dtLocalToUTC(editEnd);
      const directs = editTiers.map(t => BigInt(Math.floor(parseFloat(t.direct) * 1e18)));
      const teams   = editTiers.map(t => BigInt(Math.floor(parseFloat(t.team)   * 1e18)));
      const rewards = editTiers.map(t => BigInt(Math.floor(parseFloat(t.reward) * 1e18)));
      const tx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'updateBonanza',
        args: [BigInt(selectedId), st, et, editActive, directs, teams, rewards],
      });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      toast.success('Bonanza updated ✓', { id });
      isEditing = false;
      await loadBonanza(selectedId);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed', { id }); }
    finally { busy = false; }
  }

  onMount(async () => { await initWeb3(); loadMeta(); });
  $: if (selectedId === 0) loadSalaryEarners();
</script>

<div class="space-y-6">

  <!-- Header -->
  <div class="flex items-center gap-3">
    <svg class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
    </svg>
    <h2 class="text-xl font-bold text-text-primary">Bonanza — Eligible Users</h2>
  </div>

  <!-- Salary Earners Section (shown when no bonanza selected) -->
  {#if selectedId === 0}
    <div class="card p-5" style="border-color:rgba(167,139,250,0.3)">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-text-primary">Salary Earners</h3>
          <p class="text-xs text-text-muted mt-0.5">Users with active rank salary slots</p>
        </div>
        <button on:click={loadSalaryEarners} disabled={salaryLoading}
                class="btn-outline px-3 py-1.5 text-xs">
          {salaryLoading ? `Scanning… ${salaryProgress}%` : '↻ Scan Users'}
        </button>
      </div>

      {#if salaryLoading}
        <div class="py-8 text-center">
          <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"></div>
          <p class="text-sm text-text-muted">Scanning {totalUsers} users… {salaryProgress}%</p>
          <div class="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full" style="background:var(--color-surface-3)">
            <div class="h-full rounded-full transition-all" style="width:{salaryProgress}%; background:linear-gradient(90deg,#a78bfa,#8b5cf6)"></div>
          </div>
        </div>
      {:else if salaryEarners.length === 0}
        <div class="py-8 text-center text-sm text-text-muted">
          No salary earners yet. Click "Scan Users" to check.
        </div>
      {:else}
        <div class="space-y-2">
          {#each salaryEarners as s}
            <div class="card p-4" style="border:1px solid rgba(167,139,250,0.3)">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style="background:rgba(167,139,250,0.2); color:#a78bfa">
                      {s.rank}
                    </span>
                    <span class="rounded-lg px-2 py-0.5 text-xs font-bold" style="background:rgba(54,255,111,0.15); color:#36FF6F">Active</span>
                  </div>
                  <p class="font-mono text-sm text-text-primary">{short(s.address)}</p>
                  <button on:click={() => navigator.clipboard.writeText(s.address)}
                          class="mt-0.5 text-xs text-text-muted hover:text-purple-400">Copy full address</button>
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <p class="text-xs text-text-muted">Daily Salary</p>
                    <p class="font-bold" style="color:#a78bfa">{fmt(s.salaryPerDay)}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-text-muted">Claimable</p>
                    <p class="font-semibold text-text-primary">{s.pendingDays} days</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-text-muted">Expires</p>
                    <p class="text-xs text-text-primary">{new Date(s.expiry * 1000).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if loading}
    <div class="flex h-32 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
    </div>
  {:else if metaError}
    <div class="card p-6 text-error text-sm">⚠ Load error: {metaError}</div>
  {:else if bonanzaCount === 0}
    <div class="card py-16 text-center">
      <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style="background:rgba(255,140,66,0.1)">
        <svg class="h-10 w-10 text-amber-400 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138z"/>
        </svg>
      </div>
      <h3 class="mb-2 text-lg font-bold text-text-primary">No Bonanzas Created</h3>
      <p class="text-sm text-text-muted">Create a bonanza in the Configuration tab first.</p>
    </div>
  {:else}

    <!-- Bonanza Selector -->
    <div class="card p-4">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <span class="text-sm text-text-muted">Select Bonanza:</span>
        {#each Array.from({ length: bonanzaCount }, (_, i) => i) as id}
          <button on:click={() => selectBonanza(id)}
                  class="rounded-xl px-4 py-1.5 text-sm font-bold transition-all"
                  style="background:{selectedId === id ? 'linear-gradient(135deg,#FF8C42,#FF5833)' : 'var(--color-surface-3)'}; color:{selectedId === id ? '#000' : '#E0E6FF'}">
            #{id + 1}
          </button>
        {/each}
      </div>

      <!-- Bonanza Info / Edit -->
      {#if bonanzaLoading}
        <div class="flex h-16 items-center justify-center"><div class="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div></div>
      {:else if bonanza}

        {#if !isEditing}
          <!-- View Mode -->
          <div class="rounded-xl border border-border p-4" style="background:rgba(0,0,0,0.1)">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="font-bold text-text-primary">{bonanza.name}</h3>
              <div class="flex items-center gap-2">
                <span class="rounded-lg px-2 py-1 text-xs font-bold"
                      style="background:{bonanza.active ? 'rgba(54,255,111,0.15)' : 'rgba(255,88,51,0.15)'}; color:{bonanza.active ? '#36FF6F' : '#FF5833'}">
                  {bonanza.active ? 'Active' : 'Inactive'}
                </span>
                <button on:click={startEdit}
                        class="rounded-lg p-1.5 text-xs transition-colors hover:opacity-80"
                        style="background:var(--color-surface-3); color:#00FFE7">✏ Edit</button>
              </div>
            </div>
            <div class="mb-3 grid grid-cols-2 gap-3">
              <div class="rounded-lg px-3 py-2" style="background:var(--color-surface-3)">
                <p class="text-xs text-text-muted">Start (IST)</p>
                <p class="mt-0.5 text-sm font-medium text-text-primary">{dateToIST(bonanza.startDate)}</p>
              </div>
              <div class="rounded-lg px-3 py-2" style="background:var(--color-surface-3)">
                <p class="text-xs text-text-muted">End (IST)</p>
                <p class="mt-0.5 text-sm font-medium text-text-primary">{dateToIST(bonanza.endDate)}</p>
              </div>
            </div>

            <!-- Tiers Table -->
            <div class="mb-2 rounded-lg px-3 py-2 text-xs" style="background:rgba(23,98,255,0.08); color:#7D8BBA">
              💡 <span style="color:#00FFE7">Qualification:</span> Both Direct AND Team conditions must be met. 0 = No Requirement (auto-pass).
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <th class="pb-2 text-left text-xs text-text-muted">Tier</th>
                    <th class="pb-2 text-right text-xs text-text-muted">Direct Target</th>
                    <th class="pb-2 text-right text-xs text-text-muted">Team Target</th>
                    <th class="pb-2 text-right text-xs text-text-muted">Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {#each bonanza.directTargets as _, i}
                    <tr class="border-b border-border/30">
                      <td class="py-2 text-text-primary">Tier {i + 1}</td>
                      <td class="py-2 text-right">
                        {#if Number(bonanza.directTargets[i]) === 0}
                          <span class="text-xs italic text-text-muted">No Requirement</span>
                        {:else}
                          <span style="color:#36FF6F">{fmt(bonanza.directTargets[i])}</span>
                        {/if}
                      </td>
                      <td class="py-2 text-right">
                        {#if Number(bonanza.teamTargets[i]) === 0}
                          <span class="text-xs italic text-text-muted">No Requirement</span>
                        {:else}
                          <span style="color:#00FFE7">{fmt(bonanza.teamTargets[i])}</span>
                        {/if}
                      </td>
                      <td class="py-2 text-right font-bold text-amber-400">{fmt(bonanza.rewardAmounts[i])}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

        {:else}
          <!-- Edit Mode -->
          <div class="rounded-xl border p-4" style="border-color:rgba(255,140,66,0.4); background:rgba(255,140,66,0.03)">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="font-bold text-amber-400">✏ Edit: {bonanza.name}</h3>
              <button on:click={() => isEditing = false} class="text-xs text-red-400 hover:text-red-300">✕ Cancel</button>
            </div>

            <!-- Active toggle -->
            <div class="mb-4 flex items-center justify-between rounded-xl border border-border px-3 py-2.5" style="background:var(--color-surface-3)">
              <span class="text-sm text-text-primary">Bonanza Active</span>
              <button on:click={() => editActive = !editActive}
                      aria-label="Toggle bonanza active"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style="background:{editActive ? '#36FF6F' : '#4B5563'}">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      style="transform: translateX({editActive ? '1.5rem' : '0.25rem'})"></span>
              </button>
            </div>

            <!-- Dates -->
            <div class="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p class="mb-1 text-xs text-text-muted">Start Date & Time</p>
                <input bind:value={editStart} type="datetime-local"
                       class="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none"
                       style="background:var(--color-surface-3); color:var(--color-text-primary)" />
              </div>
              <div>
                <p class="mb-1 text-xs text-text-muted">End Date & Time</p>
                <input bind:value={editEnd} type="datetime-local"
                       class="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none"
                       style="background:var(--color-surface-3); color:var(--color-text-primary)" />
              </div>
            </div>

            <!-- Tiers -->
            <div class="mb-4 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs text-text-muted">Tiers</p>
                <button on:click={addEditTier} class="text-xs" style="color:#00FFE7">+ Add Tier</button>
              </div>
              {#each editTiers as tier, i}
                <div class="rounded-xl border border-border p-3" style="background:var(--color-surface-3)">
                  <div class="mb-2 flex justify-between">
                    <span class="text-xs font-bold text-amber-400">Tier {i + 1}</span>
                    {#if editTiers.length > 1}
                      <button on:click={() => removeEditTier(i)} class="text-xs text-red-400">✕</button>
                    {/if}
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    {#each [['direct','Direct','0'], ['team','Team','10000'], ['reward','Reward','500']] as [field, label, ph]}
                      <div>
                        <p class="mb-1 text-xs text-text-muted">{label}</p>
                        <input value={tier[field as keyof EditTier]}
                               on:input={(e) => updateEditTier(i, field as keyof EditTier, (e.target as HTMLInputElement).value)}
                               type="number" placeholder={ph}
                               class="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none"
                               style="background:var(--color-surface-2); color:var(--color-text-primary)" />
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>

            <div class="flex gap-3">
              <button on:click={saveEdit} disabled={busy}
                      class="flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
                {busy ? 'Saving…' : '💾 Save Changes'}
              </button>
              <button on:click={() => isEditing = false} class="rounded-xl px-4 py-2.5 btn-outline text-sm">Cancel</button>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Qualified Users -->
    {#if bonanza?.active && !isEditing}
      <div>
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-bold text-text-primary">Qualified Users</h3>
          <button on:click={loadQualifiedUsers} disabled={qualLoading}
                  class="btn-outline px-3 py-1.5 text-xs">
            {qualLoading ? `Scanning… ${qualProgress}%` : '↻ Scan Users'}
          </button>
        </div>

        {#if qualLoading}
          <div class="card py-8 text-center">
            <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            <p class="text-sm text-text-muted">Scanning {totalUsers} users… {qualProgress}%</p>
            <div class="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full" style="background:var(--color-surface-3)">
              <div class="h-full rounded-full transition-all" style="width:{qualProgress}%; background:linear-gradient(90deg,#FF8C42,#FF5833)"></div>
            </div>
          </div>
        {:else if qualUsers.length === 0}
          <div class="card py-8 text-center text-sm text-text-muted">
            No qualified users yet. Click "Scan Users" to check.
          </div>
        {:else}
          <div class="space-y-2">
            {#each qualUsers as u}
              <div class="card p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="rounded-lg px-2 py-0.5 text-xs font-bold text-black"
                            style="background:linear-gradient(135deg,#FF8C42,#FF5833)">
                        Tier {u.tierIndex + 1}
                      </span>
                      {#if u.isPaid}
                        <span class="rounded-lg px-2 py-0.5 text-xs font-bold" style="background:rgba(54,255,111,0.15); color:#36FF6F">Paid</span>
                      {/if}
                    </div>
                    <p class="font-mono text-sm text-text-primary">{short(u.address)}</p>
                    <button on:click={() => navigator.clipboard.writeText(u.address)}
                            class="mt-0.5 text-xs text-text-muted hover:text-amber-400">Copy full address</button>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <p class="text-xs text-text-muted">Reward</p>
                      <p class="font-bold text-amber-400">{fmt(u.rewardAmount)}</p>
                    </div>
                    <div class="hidden text-right sm:block">
                      <p class="text-xs text-text-muted">Power/Weaker/Weakest</p>
                      <p class="text-xs text-text-primary">{fmt(u.power)} / {fmt(u.weaker)} / {fmt(u.weakest)}</p>
                    </div>
                    {#if !u.isPaid}
                      <button on:click={() => payUser(u.address)} disabled={busy}
                              class="rounded-xl px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                              style="background:linear-gradient(135deg,#36FF6F,#00FFE7)">
                        {busy ? '…' : 'Pay'}
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

