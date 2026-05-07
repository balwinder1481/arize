<script lang="ts">
  import { onMount } from 'svelte';
  import { formatUnits, parseUnits } from 'viem';
  import { readContract, writeContractWithGas, waitForTransactionReceipt, getPublicClient } from '$lib/web3/store';
  import { getWagmiConfig } from '$lib/web3/config';
  import { arizeBizV2Abi, usdtAbi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { toast } from 'svelte-sonner';
  import type { TeamData } from '$lib/types/dashboard';

  export let userId:      bigint = 0n;
  export let directCount: bigint = 0n;
  export let team: TeamData = { counts: Array(10).fill(0), business: Array(10).fill(0n) };
  export let userAddress: string = '';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;
  const USDT  = env.contracts.usdt           as `0x${string}`;

  let copied = false;

  // ── Register for someone ──────────────────────────────────
  let regAddr     = '';
  let regRefId    = String(userId || '');
  let regAmt      = 100;
  let regStep     = 20;
  let regMin      = 100;
  let regMax      = 1000;
  let regBusy     = false;
  let regStatus   = '';
  let regErr      = false;
  let regAddrState: 'idle'|'checking'|'free'|'taken' = 'idle';
  let regTimer: ReturnType<typeof setTimeout>;

  // success modal
  let showSuccessModal = false;
  let successAddr = '';
  let successUserId = 0n;
  let successAmt = 0;

  $: if (userId > 0n && !regRefId) regRefId = userId.toString();

  function isAddr(a: string) { return /^0x[0-9a-fA-F]{40}$/.test(a); }
  function setReg(msg: string, err = false) { regStatus = msg; regErr = err; }

  async function loadRegConfig() {
    try {
      const wc = getWagmiConfig()!;
      const [mi, ma, mul] = await Promise.all([
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'minInvest',      args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'maxInvest',      args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'investMultiple', args: [] }),
      ]);
      regMin  = Number(mi as bigint) / 1e18;
      regMax  = Number(ma as bigint) / 1e18;
      regStep = Number(mul as bigint) / 1e18;
      regAmt  = regMin;
    } catch { /* defaults */ }
  }

  function onRegAddrInput() {
    regAddrState = 'idle';
    if (!regAddr || !isAddr(regAddr)) return;
    clearTimeout(regTimer);
    regTimer = setTimeout(async () => {
      regAddrState = 'checking';
      try {
        const uid = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [regAddr as `0x${string}`] });
        regAddrState = Number(uid) > 0 ? 'taken' : 'free';
      } catch { regAddrState = 'idle'; }
    }, 600);
  }

  async function doRegister() {
    if (!isAddr(regAddr))          { toast.error('Invalid wallet address'); return; }
    if (regAddrState === 'taken')  { toast.error('Address already registered'); return; }
    if (!regRefId || isNaN(Number(regRefId))) { toast.error('Enter a valid referrer ID'); return; }
    regBusy = true;
    const id = toast.loading('Approving USDT…');
    try {
      const wc  = getWagmiConfig()!;
      const amt = parseUnits(String(regAmt), 18);
      const appTx = await writeContractWithGas({ address: USDT, abi: usdtAbi, functionName: 'approve', args: [PROXY, amt] });
      await waitForTransactionReceipt(wc, { hash: appTx });
      toast.loading('Registering user…', { id });
      const tx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'register',
        args: [regAddr as `0x${string}`, Number(regRefId), amt],
      });
      await waitForTransactionReceipt(wc, { hash: tx });
      try {
        successUserId = await readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [regAddr as `0x${string}`] }) as unknown as bigint;
      } catch { successUserId = 0n; }
      successAddr = regAddr;
      successAmt  = regAmt;
      toast.success(`Registered successfully! $${regAmt} USDT package ✓`, { id });
      showSuccessModal = true;
      regAddr = ''; regAddrState = 'idle'; regStatus = '';
      loadBalances();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Registration failed', { id });
      setReg(e instanceof Error ? e.message : 'Failed', true);
    }
    finally { regBusy = false; }
  }

  $: canReg = isAddr(regAddr) && regAddrState === 'free' && !!regRefId && !regBusy;

  let usdtBal = 0n;
  let bnbBal   = 0n;
  let balLoading = false;

  async function loadBalances() {
    if (!userAddress) return;
    balLoading = true;
    try {
      const client = getPublicClient(getWagmiConfig()!);
      const [ub, bb] = await Promise.all([
        readContract(getWagmiConfig()!, { address: USDT, abi: usdtAbi, functionName: 'balanceOf', args: [userAddress as `0x${string}`] }) as Promise<bigint>,
        client ? client.getBalance({ address: userAddress as `0x${string}` }) : Promise.resolve(0n),
      ]);
      usdtBal = ub;
      bnbBal  = bb;
    } catch { /* ignore */ }
    finally { balLoading = false; }
  }

  onMount(() => { loadRegConfig(); loadBalances(); });
  $: if (userAddress) loadBalances();

  function fmt(val: bigint, dec = 18) {
    return Number(formatUnits(val, dec)).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  $: referralLink = (typeof window !== 'undefined' && userId > 0n)
    ? `${window.location.origin}/register?ref=${userId}`
    : '';

  $: totalTeam     = team.counts.reduce((a, b) => a + b, 0);
  $: totalBusiness = team.business.reduce((a, b) => a + b, 0n);

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

<!-- Success Modal -->
{#if showSuccessModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
       role="dialog" aria-modal="true" tabindex="-1"
       on:click|self={() => showSuccessModal = false}
       on:keydown={(e) => e.key === 'Escape' && (showSuccessModal = false)}>
    <div class="card w-full max-w-sm p-7 text-center">
      <!-- Icon -->
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
           style="background:rgba(54,255,111,0.1)">
        <svg class="h-7 w-7" style="color:#36FF6F" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="mb-1 text-lg font-bold text-text-primary">User Registered! 🎉</h3>
      <p class="mb-5 text-xs text-text-muted">Share the details below with the new user</p>

      <div class="space-y-3 text-left">
        <!-- User ID -->
        {#if successUserId > 0n}
          <div class="flex items-center justify-between rounded-xl px-4 py-3"
               style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25)">
            <div>
              <p class="text-xs text-text-muted">User ID</p>
              <p class="text-xl font-bold gold-text">AB{successUserId}</p>
            </div>
            <button on:click={() => { navigator.clipboard.writeText(String(successUserId)); toast.success('ID copied!'); }}
                    class="rounded-xl px-3 py-1.5 text-xs font-bold"
                    style="background:var(--color-surface-3);color:var(--color-text-secondary)">
              Copy
            </button>
          </div>
        {/if}

        <!-- Wallet -->
        <div class="flex items-center justify-between rounded-xl px-4 py-3"
             style="background:var(--color-surface-3);border:1px solid var(--color-border)">
          <div class="min-w-0 flex-1">
            <p class="text-xs text-text-muted">Wallet Address</p>
            <p class="truncate font-mono text-xs text-text-primary">{successAddr}</p>
          </div>
          <button on:click={() => { navigator.clipboard.writeText(successAddr); toast.success('Address copied!'); }}
                  class="ml-2 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold"
                  style="background:var(--color-surface-3);color:var(--color-text-secondary)">
            Copy
          </button>
        </div>

        <!-- Amount + Referrer -->
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-xl px-3 py-2.5 text-center" style="background:var(--color-surface-3)">
            <p class="text-xs text-text-muted">Package</p>
            <p class="font-bold" style="color:#22c55e">${successAmt} USDT</p>
          </div>
          <div class="rounded-xl px-3 py-2.5 text-center" style="background:var(--color-surface-3)">
            <p class="text-xs text-text-muted">Under Referrer</p>
            <p class="font-bold text-text-primary">AB{regRefId}</p>
          </div>
        </div>
      </div>

      <button on:click={() => showSuccessModal = false}
              class="mt-5 w-full rounded-xl py-2.5 text-sm font-bold text-black"
              style="background:linear-gradient(135deg,#f59e0b,#d97706)">
        Done
      </button>
    </div>
  </div>
{/if}

<div class="space-y-5">

  <!-- Summary cards -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
    <div class="card p-5 text-center">
      <div class="text-3xl font-bold gold-text">{directCount.toString()}</div>
      <div class="mt-1 text-xs text-text-muted">Direct Referrals</div>
    </div>
    <div class="card p-5 text-center">
      <div class="text-3xl font-bold" style="color:#22c55e">{totalTeam}</div>
      <div class="mt-1 text-xs text-text-muted">Total Team</div>
    </div>
    <div class="card col-span-2 p-5 text-center sm:col-span-1">
      <div class="text-2xl font-bold" style="color:#3b82f6">${fmt(totalBusiness)}</div>
      <div class="mt-1 text-xs text-text-muted">Total Team Business</div>
    </div>
  </div>

  <!-- Referral link -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold text-text-primary">Your Referral Link</h3>
    <p class="mb-3 text-xs text-text-muted">Share this link to earn direct referral commission.</p>
    <div class="flex gap-2">
      <input
        type="text" readonly value={referralLink}
        class="flex-1 rounded-xl border border-border px-3 py-2.5 text-xs text-text-secondary
               outline-none truncate"
        style="background:var(--color-surface-3)"
      />
      <button on:click={copyLink}
              class="btn-primary px-4 py-2.5 text-sm whitespace-nowrap transition-all"
              style="{copied ? 'background:linear-gradient(135deg,#22c55e,#16a34a)' : ''}">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
    <p class="mt-2 text-xs text-text-muted font-mono truncate">
      Your ID: AB{userId.toString()}
    </p>
  </div>

  <!-- Register Someone -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold text-text-primary">Register Someone</h3>
    <p class="mb-3 text-xs text-text-muted">Pay from your wallet and register someone under a referrer. You will pay USDT + gas.</p>

    <!-- Balances -->
    <div class="mb-4 grid grid-cols-2 gap-2">
      <div class="rounded-xl p-3" style="background:var(--color-surface-3)">
        <p class="text-xs text-text-muted">USDT Balance</p>
        <p class="font-bold" style="color:#22c55e">{balLoading ? '…' : `$${Number(formatUnits(usdtBal, 18)).toFixed(2)}`}</p>
      </div>
      <div class="rounded-xl p-3" style="background:var(--color-surface-3)">
        <p class="text-xs text-text-muted">BNB Balance</p>
        <p class="font-bold" style="color:#f59e0b">{balLoading ? '…' : Number(formatUnits(bnbBal, 18)).toFixed(4)}</p>
      </div>
    </div>

    <!-- New user address -->
    <div class="mb-3">
      <label for="regAddr" class="mb-1.5 block text-xs font-medium text-text-secondary">New User Wallet <span class="text-error">*</span></label>
      <input id="regAddr" bind:value={regAddr} on:input={onRegAddrInput} type="text" placeholder="0x..."
             class="w-full rounded-xl border px-3 py-2.5 font-mono text-xs outline-none transition-colors
                    {regAddrState === 'taken' ? 'border-error' : regAddrState === 'free' ? 'border-success' : 'border-border focus:border-gold'}"
             style="background:var(--color-surface-3); color:var(--color-text-primary)" />
      <p class="mt-1 text-xs
                {regAddrState === 'taken' ? 'text-error' : regAddrState === 'free' ? 'text-success' : 'text-text-muted'}">
        {#if regAddrState === 'checking'}⏳ Checking…
        {:else if regAddrState === 'taken'}✗ Already registered
        {:else if regAddrState === 'free'}✓ Valid, not registered
        {:else}Enter wallet address to register{/if}
      </p>
    </div>

    <!-- Referrer ID -->
    <div class="mb-3">
      <label for="regRefId" class="mb-1.5 block text-xs font-medium text-text-secondary">Referrer ID <span class="text-error">*</span></label>
      <div class="flex overflow-hidden rounded-xl border border-border" style="background:var(--color-surface-3)">
        <span class="flex items-center px-3 text-xs font-bold border-r border-border"
              style="color:#f59e0b; background:var(--color-surface-4)">AB</span>
        <input id="regRefId" bind:value={regRefId} type="number" placeholder="{userId.toString()}"
               class="w-full px-3 py-2.5 text-xs outline-none bg-transparent"
               style="color:var(--color-text-primary)" />
      </div>
    </div>

    <!-- Amount stepper -->
    <div class="mb-4 rounded-xl p-3" style="background:var(--color-surface-3)">
      <p class="mb-2 text-xs font-medium text-text-secondary">Package Amount</p>
      <div class="flex items-center justify-center gap-3">
        <button on:click={() => { if (regAmt - regStep >= regMin) regAmt -= regStep; }}
                disabled={regAmt <= regMin || regBusy}
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-border font-bold transition-colors hover:border-gold disabled:opacity-30"
                style="background:var(--color-surface-4); color:var(--color-text-primary)">−</button>
        <div class="text-center">
          <span class="text-2xl font-bold gold-text">${regAmt}</span>
          <p class="text-xs text-text-muted">USDT</p>
        </div>
        <button on:click={() => { if (regAmt + regStep <= regMax) regAmt += regStep; }}
                disabled={regAmt >= regMax || regBusy}
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-border font-bold transition-colors hover:border-gold disabled:opacity-30"
                style="background:var(--color-surface-4); color:var(--color-text-primary)">+</button>
      </div>
      <div class="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
        <div class="rounded-lg p-1.5" style="background:var(--color-surface-4)"><p class="text-text-muted">Min</p><p class="font-bold">${regMin}</p></div>
        <div class="rounded-lg p-1.5" style="background:var(--color-surface-4)"><p class="text-text-muted">Step</p><p class="font-bold">${regStep}</p></div>
        <div class="rounded-lg p-1.5" style="background:var(--color-surface-4)"><p class="text-text-muted">Max</p><p class="font-bold">${regMax}</p></div>
      </div>
    </div>

    {#if regStatus}
      <div class="mb-3 rounded-xl px-3 py-2.5 text-xs font-medium"
           style="background:{regErr ? 'rgba(255,88,51,0.1)' : 'rgba(54,255,111,0.1)'}; color:{regErr ? '#FF5833' : '#36FF6F'}">
        {regStatus}
      </div>
    {/if}

    <button on:click={doRegister} disabled={!canReg}
            class="btn-primary w-full py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
      {#if regBusy}
        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent mr-2"></span>Processing…
      {:else}
        Register · ${regAmt} USDT
      {/if}
    </button>
  </div>

  <!-- Level breakdown -->
  <div class="card p-5">
    <h3 class="mb-4 font-bold text-text-primary">10-Level Team Breakdown</h3>
    <div class="space-y-2">
      {#each team.counts as count, i}
        {@const hasMembers = count > 0}
        <div class="flex items-center justify-between rounded-xl px-4 py-2.5 transition-opacity
                    {hasMembers ? '' : 'opacity-35'}"
             style="background:var(--color-surface-3)">
          <div class="flex items-center gap-3">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
                        {hasMembers ? 'text-black' : 'text-text-muted'}"
                 style="{hasMembers
                   ? 'background:linear-gradient(135deg,#f59e0b,#d97706)'
                   : 'background:var(--color-surface-4)'}">
              {i + 1}
            </div>
            <span class="text-sm text-text-secondary">Level {i + 1}</span>
          </div>
          <div class="flex gap-5 text-sm">
            <span class="font-semibold text-text-primary w-20 text-right">
              {count} member{count !== 1 ? 's' : ''}
            </span>
            <span class="font-semibold gold-text w-24 text-right">
              ${fmt(team.business[i])}
            </span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
