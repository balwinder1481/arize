<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isConnected, address, connectWallet, writeContractWithGas,
           waitForTransactionReceipt, readContract, getPublicClient } from '$lib/web3/store';
  import { getWagmiConfig, initWeb3 } from '$lib/web3/config';
  import WalletButton from '$lib/components/WalletButton.svelte';
  import { env } from '$lib/constants/env';
  import { arizeBizV2Abi, arizeBizHubAbi, usdtAbi } from '$lib/contracts';
  import { formatUnits } from 'viem';
  import { toast } from 'svelte-sonner';

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;
  const HUB   = env.contracts.arizeBizHub   as `0x${string}`;
  const USDT  = env.contracts.usdt as `0x${string}`;

  // ── State ──────────────────────────────────────────────────
  let referrerId       = '';
  let amountWei        = 0n;
  let minInvestWei     = 100n * 10n**18n;
  let maxInvestWei     = 1000n * 10n**18n;
  let multipleWei      = 100n * 10n**18n;
  let loading          = false;
  let registrationDone = false;
  let newUserId: bigint = 0n;

  // balance state
  let usdtBalance  = 0n;
  let bnbBalance   = 0n;
  let balLoading   = true;

  // referrer validation
  let refChecking  = false;
  let refValid     : boolean | null = null;
  let refTimer     : ReturnType<typeof setTimeout>;

  function short(a: string) { return a.slice(0, 6) + '…' + a.slice(-4); }
  function fmtAmt(wei: bigint) { return Number(formatUnits(wei, 18)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

  $: insufficientUsdt = !balLoading && amountWei > 0n && usdtBalance < amountWei;
  $: insufficientBnb  = !balLoading && bnbBalance < 3_000_000_000_000_000n; // ~0.003 BNB

  function increment() { if (amountWei + multipleWei <= maxInvestWei) amountWei += multipleWei; }
  function decrement() { if (amountWei - multipleWei >= minInvestWei) amountWei -= multipleWei; }

  // ── Referrer validation (debounced) ───────────────────────
  function onRefInput() {
    refValid = null;
    refChecking = false;
    clearTimeout(refTimer);
    if (!referrerId || isNaN(Number(referrerId))) return;
    refChecking = true;
    refTimer = setTimeout(async () => {
      try {
        const addr = await readContract(getWagmiConfig()!, {
          address: PROXY, abi: arizeBizV2Abi, functionName: 'idToAddr', args: [Number(referrerId)],
        }) as string;
        refValid = addr !== '0x0000000000000000000000000000000000000000';
      } catch { refValid = false; }
      refChecking = false;
    }, 600);
  }

  // ── Load balances ──────────────────────────────────────────
  async function loadBalances() {
    if (!$address) return;
    balLoading = true;
    try {
      const client = getPublicClient(getWagmiConfig()!);
      const [ub, nb] = await Promise.all([
        readContract(getWagmiConfig()!, { address: USDT, abi: usdtAbi, functionName: 'balanceOf', args: [$address] }) as Promise<bigint>,
        client ? client.getBalance({ address: $address as `0x${string}` }) : Promise.resolve(0n),
      ]);
      usdtBalance = ub as bigint;
      bnbBalance  = nb;
    } catch { /* ignore */ }
    finally { balLoading = false; }
  }

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit() {
    if (!$address) { await connectWallet(); return; }
    if (!referrerId) { toast.error('Enter a referrer ID'); return; }
    if (refChecking || refValid === null) { toast.error('Wait for referrer validation'); return; }
    if (refValid === false) { toast.error('Invalid referrer ID'); return; }
    if (insufficientUsdt) { toast.error(`Insufficient USDT. Need $${fmtAmt(amountWei)}`); return; }
    if (insufficientBnb)  { toast.error('Insufficient BNB for gas fees'); return; }

    loading = true;
    const tid = toast.loading('Approving USDT…');
    try {
      const appTx = await writeContractWithGas({ address: USDT, abi: usdtAbi, functionName: 'approve', args: [HUB, amountWei] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: appTx });
      toast.loading('Sending transaction…', { id: tid });

      const tx = await writeContractWithGas({ address: HUB, abi: arizeBizHubAbi, functionName: 'registerUser', args: [Number(referrerId), amountWei] });
      await waitForTransactionReceipt(getWagmiConfig()!, { hash: tx });
      try {
        newUserId = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [$address] }) as unknown as bigint;
      } catch { newUserId = 0n; }
      toast.success('Registered successfully! 🎉', { id: tid });
      registrationDone = true;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message.slice(0, 120) : 'Transaction failed', { id: tid });
    } finally { loading = false; }
  }

  // ── Init ───────────────────────────────────────────────────
  onMount(async () => {
    await initWeb3();

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') ?? '';
    if (ref) { referrerId = ref; onRefInput(); }

    try {
      const [mi, ma, mul] = await Promise.all([
        readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'minInvest',      args: [] }),
        readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'maxInvest',      args: [] }),
        readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'investMultiple', args: [] }),
      ]);
      minInvestWei = mi as bigint;
      maxInvestWei = ma as bigint;
      multipleWei  = mul as bigint;
      amountWei    = mi as bigint;
    } catch { amountWei = minInvestWei; }

  });

  async function checkRegistration() {
    if (!$address) return;
    try {
      const uid = await readContract(getWagmiConfig()!, { address: PROXY, abi: arizeBizV2Abi, functionName: 'addrToId', args: [$address] }) as unknown as bigint;
      if (uid > 0n) goto('/dashboard');
    } catch { /* ignore */ }
  }

  $: if ($address) { loadBalances(); checkRegistration(); }
</script>

<svelte:head>
  <title>Register — ArizeBiz</title>
</svelte:head>

<div class="min-h-screen px-4 py-10" style="background:var(--color-surface)">
  <!-- Glow -->
  <div class="pointer-events-none fixed inset-0 overflow-hidden">
    <div class="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full opacity-10"
         style="background:radial-gradient(circle,#f59e0b 0%,transparent 70%)"></div>
  </div>

  <div class="relative mx-auto w-full max-w-lg">

    <!-- Logo + back -->
    <div class="mb-6 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-black"
             style="background:linear-gradient(135deg,#f59e0b,#d97706)">AB</div>
        <span class="font-bold text-text-primary">Arize<span class="gold-text">Biz</span></span>
      </a>
      <a href="/" class="rounded-xl border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
         style="background:var(--color-surface-3)">← Back</a>
    </div>

    <!-- Success screen -->
    {#if registrationDone}
      <div class="card p-8 text-center">
        <!-- Check icon -->
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
             style="background:rgba(54,255,111,0.1)">
          <svg class="h-8 w-8" style="color:#36FF6F" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="mb-1 text-2xl font-bold text-text-primary">Registration Successful! 🎉</h2>
        <p class="mb-6 text-sm text-text-muted">Welcome to ArizeBiz — save your details below</p>

        <!-- Info cards -->
        <div class="mb-6 space-y-3 text-left">
          {#if newUserId > 0n}
            <div class="flex items-center justify-between rounded-xl px-4 py-3"
                 style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25)">
              <div>
                <p class="text-xs text-text-muted">Your User ID</p>
                <p class="text-xl font-bold gold-text">AB{newUserId}</p>
              </div>
              <button on:click={() => { navigator.clipboard.writeText(String(newUserId)); toast.success('ID copied!'); }}
                      class="rounded-xl px-3 py-1.5 text-xs font-bold"
                      style="background:var(--color-surface-3);color:var(--color-text-secondary)">
                Copy ID
              </button>
            </div>
          {/if}
          <div class="flex items-center justify-between rounded-xl px-4 py-3"
               style="background:var(--color-surface-3);border:1px solid var(--color-border)">
            <div class="min-w-0 flex-1">
              <p class="text-xs text-text-muted">Wallet Address</p>
              <p class="truncate font-mono text-sm text-text-primary">{$address}</p>
            </div>
            <button on:click={() => { navigator.clipboard.writeText($address ?? ''); toast.success('Address copied!'); }}
                    class="ml-3 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold"
                    style="background:var(--color-surface-3);color:var(--color-text-secondary)">
              Copy
            </button>
          </div>
          <div class="flex items-center justify-between rounded-xl px-4 py-3"
               style="background:var(--color-surface-3);border:1px solid var(--color-border)">
            <div>
              <p class="text-xs text-text-muted">Package Amount</p>
              <p class="font-bold" style="color:#22c55e">${fmtAmt(amountWei)} USDT</p>
            </div>
            <div>
              <p class="text-xs text-text-muted">Referrer ID</p>
              <p class="font-bold text-text-primary">AB{referrerId}</p>
            </div>
          </div>
        </div>

        <a href="/dashboard" class="btn-primary block w-full py-3 text-sm font-bold">Go to Dashboard →</a>
      </div>

    <!-- Main registration form -->
    {:else}
      <div class="card gold-border p-8">
        <!-- Header -->
        <div class="mb-6 text-center">
          <h1 class="text-2xl font-bold text-text-primary">Create Account</h1>
          <p class="mt-1 text-sm text-text-secondary">Register and start earning today</p>
        </div>

        <!-- Wallet not connected -->
        {#if !$isConnected}
          <div class="py-10 text-center">
            <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                 style="background:rgba(247,159,31,0.1);box-shadow:0 0 40px rgba(245,158,11,0.15)">
              <svg class="h-10 w-10" style="color:#f59e0b" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <h2 class="mb-2 text-xl font-bold text-text-primary">Connect Your Wallet</h2>
            <p class="mb-6 text-sm text-text-muted">Connect your wallet to continue with registration</p>
            <div class="flex justify-center">
              <WalletButton size="lg" />
            </div>
          </div>

        {:else}
          <div class="space-y-5">
            <!-- User + referrer info -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-3" style="background:var(--color-surface-3)">
                <p class="text-xs text-text-muted">Your Wallet</p>
                <p class="font-mono text-sm font-bold text-text-primary">{short($address ?? '')}</p>
              </div>
              <div class="rounded-xl p-3" style="background:var(--color-surface-3)">
                <p class="text-xs text-text-muted">Referrer ID</p>
                <p class="text-sm font-bold {referrerId && refValid === true ? 'text-success' : referrerId && refValid === false ? 'text-error' : 'text-text-muted'}">
                  {#if !referrerId}
                    Required
                  {:else if refChecking || refValid === null}
                    Checking…
                  {:else if refValid === true}
                    AB{referrerId} ✓
                  {:else}
                    Invalid ✗
                  {/if}
                </p>
              </div>
            </div>

            <!-- Balances -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-3" style="background:var(--color-surface-3)">
                <p class="text-xs text-text-muted">USDT Balance</p>
                <p class="font-bold" style="color:#22c55e">{balLoading ? '…' : `$${fmtAmt(usdtBalance)}`}</p>
              </div>
              <div class="rounded-xl p-3" style="background:var(--color-surface-3)">
                <p class="text-xs text-text-muted">BNB Balance</p>
                <p class="font-bold" style="color:#f59e0b">{balLoading ? '…' : Number(formatUnits(bnbBalance, 18)).toFixed(4)}</p>
              </div>
            </div>

            <!-- Referrer ID input -->
            <div>
              <label for="refId" class="mb-1.5 block text-sm font-medium text-text-secondary">
                Referrer ID <span class="text-error">*</span>
              </label>
              <input id="refId" type="number" bind:value={referrerId} on:input={onRefInput}
                     placeholder="Enter referrer user ID"
                     class="w-full rounded-xl border px-4 py-3 text-text-primary placeholder:text-text-muted outline-none transition-colors
                            {refValid === true ? 'border-success' : refValid === false ? 'border-error' : 'border-border focus:border-gold'}"
                     style="background:var(--color-surface-3)" />
              <p class="mt-1.5 text-xs
                         {!referrerId ? 'text-text-muted' : refChecking || refValid === null ? 'text-amber-400' : refValid === true ? 'text-success' : 'text-error'}">
                {#if !referrerId}
                  ⚠ Referrer ID is required to register
                {:else if refChecking || refValid === null}
                  ⏳ Checking referrer…
                {:else if refValid === true}
                  ✓ Valid referrer AB{referrerId}
                {:else}
                  ✗ This ID is not registered — ask your referrer for their correct ID
                {/if}
              </p>
            </div>

            <!-- Package selector -->
            <div class="rounded-xl p-4" style="background:var(--color-surface-3)">
              <p class="mb-3 text-sm font-medium text-text-secondary">Select Package Amount</p>
              <div class="flex items-center justify-center gap-4">
                <button on:click={decrement} disabled={amountWei <= minInvestWei}
                        class="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-xl font-bold text-text-primary transition-colors hover:border-gold disabled:opacity-30"
                        style="background:var(--color-surface-4)">−</button>
                <div class="text-center">
                  <div class="text-4xl font-bold gold-text">${fmtAmt(amountWei)}</div>
                  <p class="text-xs text-text-muted">USDT</p>
                </div>
                <button on:click={increment} disabled={amountWei >= maxInvestWei}
                        class="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-xl font-bold text-text-primary transition-colors hover:border-gold disabled:opacity-30"
                        style="background:var(--color-surface-4)">+</button>
              </div>
              <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div class="rounded-lg p-2 text-center" style="background:var(--color-surface-4)">
                  <p class="text-text-muted">Min</p><p class="font-bold text-text-primary">${fmtAmt(minInvestWei)}</p>
                </div>
                <div class="rounded-lg p-2 text-center" style="background:var(--color-surface-4)">
                  <p class="text-text-muted">Step</p><p class="font-bold text-text-primary">${fmtAmt(multipleWei)}</p>
                </div>
                <div class="rounded-lg p-2 text-center" style="background:var(--color-surface-4)">
                  <p class="text-text-muted">Max</p><p class="font-bold text-text-primary">${fmtAmt(maxInvestWei)}</p>
                </div>
              </div>
            </div>

            <!-- Balance warnings -->
            {#if insufficientUsdt}
              <div class="rounded-xl border p-3 text-sm text-error" style="border-color:rgba(255,88,51,0.4);background:rgba(255,88,51,0.08)">
                ⚠ Insufficient USDT balance. Need ${fmtAmt(amountWei)} USDT.
              </div>
            {/if}
            {#if insufficientBnb}
              <div class="rounded-xl border p-3 text-sm text-error" style="border-color:rgba(255,88,51,0.4);background:rgba(255,88,51,0.08)">
                ⚠ Insufficient BNB for gas fees.
              </div>
            {/if}

            <!-- Requirements box -->
            <div class="rounded-xl border border-border p-4 text-sm text-text-muted" style="background:var(--color-surface-3)">
              <p class="mb-2 font-medium text-text-secondary">Registration Requirements:</p>
              <ul class="space-y-1 text-xs">
                <li>• Valid referrer ID (must be registered)</li>
                <li>• Minimum ${fmtAmt(minInvestWei)} USDT balance</li>
                <li>• Sufficient BNB for transaction gas</li>
                <li>• USDT approval for contract spending</li>
              </ul>
            </div>

            <!-- Submit -->
            <button on:click={handleSubmit}
                    disabled={loading || insufficientUsdt || insufficientBnb || !referrerId || refValid !== true || refChecking}
                    class="btn-primary w-full py-3 text-base font-bold">
              {loading ? 'Processing…' : `Register & Invest · $${fmtAmt(amountWei)} USDT`}
            </button>

            <p class="text-center text-xs text-text-muted">
              Already registered?
              <a href="/dashboard" class="text-gold hover:underline">Go to Dashboard</a>
            </p>
          </div>
        {/if}
      </div>

      <!-- Benefits -->
      <div class="mt-8 grid grid-cols-3 gap-4">
        {#each [
          { icon:'⚡', title:'Instant Activation', desc:'Start earning immediately after registration' },
          { icon:'🔒', title:'Secure & Verified',  desc:'Protected by blockchain smart contracts' },
          { icon:'🌐', title:'Build Your Network', desc:'Earn from 10 levels of referrals' },
        ] as b}
          <div class="card p-4 text-center">
            <div class="mb-2 text-2xl">{b.icon}</div>
            <p class="mb-1 text-xs font-bold text-text-primary">{b.title}</p>
            <p class="text-xs text-text-muted">{b.desc}</p>
          </div>
        {/each}
      </div>
    {/if}

  </div>
</div>
