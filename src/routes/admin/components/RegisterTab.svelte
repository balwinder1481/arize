<script lang="ts">
  import { onMount } from 'svelte';
  import { readContract, writeContractWithGas, waitForTransactionReceipt } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { parseUnits } from 'viem';
  import { toast } from 'svelte-sonner';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  // ── Config (loaded from contract) ─────────────────────────
  let minAmt    = 100;
  let maxAmt    = 1000;
  let stepAmt   = 20;

  async function loadConfig() {
    try {
      const wc = getWagmiConfig()!;
      const [mi, ma, mul] = await Promise.all([
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'minInvest',      args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'maxInvest',      args: [] }),
        readContract(wc, { address: PROXY, abi: arizeBizV2Abi, functionName: 'investMultiple', args: [] }),
      ]);
      minAmt  = Number(mi as bigint) / 1e18;
      maxAmt  = Number(ma as bigint) / 1e18;
      stepAmt = Number(mul as bigint) / 1e18;
      amountInput = String(minAmt);
    } catch { /* use defaults */ }
  }

  // ── Form state ────────────────────────────────────────────
  let newUserAddr  = '';
  let referrerId   = '';
  let amountInput  = '100';
  let dailyRoiPct  = '0.5';
  let busy         = false;
  let statusMsg    = '';
  let statusErr    = false;

  // success modal
  let showSuccessModal = false;
  let successAddr      = '';
  let successUserId    = 0n;
  let successAmt       = '';
  let successRoi       = '';

  // ── Validation state ──────────────────────────────────────
  let userAddrErr     = '';
  let newUserRegState: 'idle' | 'checking' | 'taken' | 'free' = 'idle';
  let referrerState:   'idle' | 'checking' | 'valid' | 'invalid' = 'idle';

  // ── Helpers ───────────────────────────────────────────────
  function isAddr(a: string) { return /^0x[0-9a-fA-F]{40}$/.test(a); }
  function setStatus(msg: string, err = false) { statusMsg = msg; statusErr = err; }
  $: dailyRoiBps = Math.round(parseFloat(dailyRoiPct || '0') * 100);

  // ── Address validation (debounced) ────────────────────────
  let checkUserTimer: ReturnType<typeof setTimeout>;
  let checkRefTimer:  ReturnType<typeof setTimeout>;

  function onUserAddrChange() {
    userAddrErr = ''; newUserRegState = 'idle';
    if (!newUserAddr) return;
    if (!isAddr(newUserAddr)) { userAddrErr = 'Invalid address format'; return; }
    clearTimeout(checkUserTimer);
    checkUserTimer = setTimeout(async () => {
      newUserRegState = 'checking';
      try {
        const uid = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [newUserAddr as `0x${string}`] });
        newUserRegState = Number(uid) > 0 ? 'taken' : 'free';
      } catch { newUserRegState = 'idle'; }
    }, 600);
  }

  function onReferrerChange() {
    referrerState = 'idle';
    if (!referrerId || isNaN(Number(referrerId))) return;
    clearTimeout(checkRefTimer);
    checkRefTimer = setTimeout(async () => {
      referrerState = 'checking';
      try {
        const addr = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'idToAddr', args: [Number(referrerId)] }) as string;
        referrerState = addr !== '0x0000000000000000000000000000000000000000' ? 'valid' : 'invalid';
      } catch { referrerState = 'idle'; }
    }, 600);
  }

  // ── Admin Register ────────────────────────────────────────
  async function doRegister() {
    if (!newUserAddr || !referrerId) { toast.error('Fill all fields'); return; }
    if (!isAddr(newUserAddr))        { toast.error('Invalid user address'); return; }
    if (newUserRegState === 'taken') { toast.error('User already registered'); return; }
    if (referrerState === 'invalid') { toast.error('Referrer not registered'); return; }
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0)            { toast.error('Invalid amount'); return; }
    if (!dailyRoiBps || dailyRoiBps <= 0) { toast.error('Enter valid daily ROI'); return; }

    busy = true;
    const id = toast.loading('Registering user with granted package…');
    try {
      const tx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'adminRegister',
        args: [newUserAddr as `0x${string}`, Number(referrerId), parseUnits(String(amountInput), 18), dailyRoiBps],
      });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      try {
        successUserId = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [newUserAddr as `0x${string}`] }) as unknown as bigint;
      } catch { successUserId = 0n; }
      successAddr = newUserAddr;
      successAmt  = amountInput;
      successRoi  = dailyRoiPct;
      toast.success(`Registered! $${amountInput} granted package @ ${dailyRoiPct}%/day ✓`, { id });
      showSuccessModal = true;
      newUserAddr = referrerId = '';
      amountInput = String(minAmt); dailyRoiPct = '0.5';
      newUserRegState = referrerState = 'idle'; statusMsg = '';
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Registration failed', { id });
      setStatus(e instanceof Error ? e.message : 'Registration failed', true);
    }
    finally { busy = false; }
  }

  $: canRegister = isAddr(newUserAddr) && referrerId !== '' && referrerState === 'valid' &&
                   newUserRegState === 'free' && !busy;

  onMount(async () => { await initWeb3(); loadConfig(); });
</script>

<!-- Success Modal -->
{#if showSuccessModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
       role="dialog" aria-modal="true" tabindex="-1"
       on:click|self={() => showSuccessModal = false}
       on:keydown={(e) => e.key === 'Escape' && (showSuccessModal = false)}>
    <div class="card w-full max-w-sm p-7 text-center">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
           style="background:rgba(54,255,111,0.1)">
        <svg class="h-7 w-7" style="color:#36FF6F" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="mb-1 text-lg font-bold text-text-primary">User Registered! 🎉</h3>
      <p class="mb-5 text-xs text-text-muted">Granted package — save these details</p>

      <div class="space-y-3 text-left">
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
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-xl px-3 py-2.5 text-center" style="background:var(--color-surface-3)">
            <p class="text-xs text-text-muted">Granted Package</p>
            <p class="font-bold" style="color:#00FFE7">${successAmt} USDT</p>
          </div>
          <div class="rounded-xl px-3 py-2.5 text-center" style="background:var(--color-surface-3)">
            <p class="text-xs text-text-muted">Daily ROI</p>
            <p class="font-bold gold-text">{successRoi}% / day</p>
          </div>
        </div>
      </div>

      <button on:click={() => showSuccessModal = false}
              class="mt-5 w-full rounded-xl py-2.5 text-sm font-bold text-black"
              style="background:linear-gradient(135deg,#36FF6F,#00FFE7)">
        Done
      </button>
    </div>
  </div>
{/if}

<div class="space-y-6">

  <!-- Header -->
  <div class="flex items-center gap-3">
    <svg class="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
    </svg>
    <h2 class="text-xl font-bold text-text-primary">Admin User Registration</h2>
  </div>

  <div class="card p-6 space-y-5" style="border-color:rgba(23,98,255,0.3)">

    <div class="flex items-start gap-4">
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style="background:rgba(0,255,231,0.1)">
        <svg class="h-6 w-6" style="color:#00FFE7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-bold text-text-primary">Register New User</h3>
        <p class="text-sm text-text-muted">Granted package — no USDT transfer. Only BNB for gas.</p>
      </div>
    </div>

    <!-- New User Address -->
    <div>
      <label for="newUserAddr" class="mb-1.5 block text-sm font-medium text-text-secondary">
        New User Wallet Address <span class="text-error">*</span>
      </label>
      <input id="newUserAddr" bind:value={newUserAddr} on:input={onUserAddrChange} type="text" placeholder="0x..."
             class="w-full rounded-xl border px-4 py-3 font-mono text-sm outline-none transition-colors
                    {userAddrErr || newUserRegState === 'taken' ? 'border-error' : newUserRegState === 'free' ? 'border-success' : 'border-border focus:border-blue-400'}"
             style="background:var(--color-surface-3); color:var(--color-text-primary)" />
      <p class="mt-1.5 text-xs
                {userAddrErr || newUserRegState === 'taken' ? 'text-error' : newUserRegState === 'free' ? 'text-success' : 'text-text-muted'}">
        {#if userAddrErr}⚠ {userAddrErr}
        {:else if newUserRegState === 'checking'}⏳ Checking address…
        {:else if newUserRegState === 'taken'}✗ This address is already registered
        {:else if newUserRegState === 'free'}✓ Valid address, not registered yet
        {:else}Enter the new user's wallet address{/if}
      </p>
    </div>

    <!-- Referrer ID -->
    <div>
      <label for="referrerId" class="mb-1.5 block text-sm font-medium text-text-secondary">
        Referrer ID <span class="text-error">*</span>
      </label>
      <div class="flex overflow-hidden rounded-xl border transition-colors
                  {referrerState === 'invalid' ? 'border-error' : referrerState === 'valid' ? 'border-success' : 'border-border'}"
           style="background:var(--color-surface-3)">
        <span class="flex items-center px-3 text-sm font-bold border-r border-border"
              style="color:#00FFE7; background:var(--color-surface-4)">AB</span>
        <input id="referrerId" bind:value={referrerId} on:input={onReferrerChange} type="number" placeholder="100001"
               class="w-full px-3 py-3 text-sm outline-none bg-transparent"
               style="color:var(--color-text-primary)" />
      </div>
      <p class="mt-1.5 text-xs
                {referrerState === 'invalid' ? 'text-error' : referrerState === 'valid' ? 'text-success' : 'text-text-muted'}">
        {#if referrerState === 'checking'}⏳ Checking referrer…
        {:else if referrerState === 'invalid'}✗ This ID is not registered
        {:else if referrerState === 'valid'}✓ Valid referrer AB{referrerId}
        {:else}Enter the referrer's user ID{/if}
      </p>
    </div>

    <!-- Package Amount stepper -->
    <div class="rounded-xl p-4" style="background:var(--color-surface-3)">
      <p class="mb-3 text-sm font-medium text-text-secondary">Package Amount <span class="text-xs text-text-muted">(virtual — no real USDT)</span></p>
      <div class="flex items-center justify-center gap-4">
        <button on:click={() => { const v = parseFloat(amountInput) - stepAmt; if (v >= minAmt) amountInput = String(v); }}
                disabled={parseFloat(amountInput) <= minAmt || busy}
                class="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-xl font-bold transition-colors hover:border-blue-400 disabled:opacity-30"
                style="background:var(--color-surface-4); color:var(--color-text-primary)">−</button>
        <div class="text-center">
          <div class="text-4xl font-bold" style="background:linear-gradient(135deg,#00FFE7,#1762FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
            ${amountInput}
          </div>
          <p class="text-xs text-text-muted">USDT (granted)</p>
        </div>
        <button on:click={() => { const v = parseFloat(amountInput) + stepAmt; if (v <= maxAmt) amountInput = String(v); }}
                disabled={parseFloat(amountInput) >= maxAmt || busy}
                class="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-xl font-bold transition-colors hover:border-blue-400 disabled:opacity-30"
                style="background:var(--color-surface-4); color:var(--color-text-primary)">+</button>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
        <div class="rounded-lg p-2" style="background:var(--color-surface-4)">
          <p class="text-text-muted">Min</p><p class="font-bold text-text-primary">${minAmt}</p>
        </div>
        <div class="rounded-lg p-2" style="background:var(--color-surface-4)">
          <p class="text-text-muted">Step</p><p class="font-bold text-text-primary">${stepAmt}</p>
        </div>
        <div class="rounded-lg p-2" style="background:var(--color-surface-4)">
          <p class="text-text-muted">Max</p><p class="font-bold text-text-primary">${maxAmt}</p>
        </div>
      </div>
    </div>

    <!-- Daily ROI -->
    <div>
      <label for="dailyRoi" class="mb-1.5 block text-sm font-medium text-text-secondary">Daily ROI %</label>
      <div class="flex items-center gap-3">
        <input id="dailyRoi" bind:value={dailyRoiPct} type="number" min="0" max="5" step="0.01" placeholder="0.5"
               class="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-blue-400"
               style="background:var(--color-surface-3); color:var(--color-text-primary)" />
        <div class="shrink-0 rounded-xl px-4 py-3 text-sm font-bold text-center min-w-20"
             style="background:var(--color-surface-3); color:#00FFE7">
          {dailyRoiBps} bps
        </div>
      </div>
      <p class="mt-1.5 text-xs text-text-muted">{dailyRoiPct}% per day · {(parseFloat(dailyRoiPct || '0') * 30).toFixed(1)}% per month</p>
    </div>

    <!-- Info box -->
    <div class="rounded-xl border p-4 text-sm" style="border-color:rgba(0,255,231,0.2);background:rgba(0,255,231,0.03)">
      <p class="mb-2 font-medium text-text-secondary">Granted Package Details:</p>
      <ul class="space-y-1 text-xs text-text-muted">
        <li>• No real USDT transferred — virtual package only</li>
        <li>• Referral & level income will NOT be paid out</li>
        <li>• Daily ROI is custom-set by admin</li>
        <li>• User can invest real USDT later for additional packages</li>
      </ul>
    </div>

    <!-- Status -->
    {#if statusMsg}
      <div class="rounded-xl px-4 py-3 text-sm font-medium"
           style="background:{statusErr ? 'rgba(255,88,51,0.1)' : 'rgba(54,255,111,0.1)'}; color:{statusErr ? '#FF5833' : '#36FF6F'}">
        {statusMsg}
      </div>
    {/if}

    <!-- Register Button -->
    <button on:click={doRegister} disabled={!canRegister}
            class="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
            style="background:linear-gradient(135deg,#00FFE7,#1762FF)">
      {#if busy}
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
        <span>Registering…</span>
      {:else}
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
        </svg>
        <span>Register with Granted Package · ${amountInput} @ {dailyRoiPct}%/day</span>
      {/if}
    </button>
  </div>
</div>
