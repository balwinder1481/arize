<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writeContractWithGas, waitForTransactionReceipt, wagmiConfig } from '$lib/web3/store';
  import { arizeBizV2Abi, usdtAbi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { parseUnits } from 'viem';

  export let workingMult = 3;
  export let txLoading   = false;

  const dispatch = createEventDispatcher<{
    refresh: void;
    txStatus: { msg: string; err: boolean };
  }>();

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;
  const USDT  = env.contracts.usdt as `0x${string}`;

  // Register fields
  let regForUser  = '';
  let regReferrer = '';
  let regAmount   = '';

  // Grant package fields
  let grantUser   = '';
  let grantAmount = '';
  let grantLimit  = '';

  function tx(msg: string, err = false) { dispatch('txStatus', { msg, err }); }

  async function adminRegister() {
    if (!regForUser || !regReferrer || !regAmount) { tx('Fill all fields', true); return; }
    tx('Approving USDT…');
    try {
      const amtWei = parseUnits(regAmount, 18);
      const appTx = await writeContractWithGas({
        address: USDT, abi: usdtAbi, functionName: 'approve', args: [PROXY, amtWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: appTx });
      tx('Registering…');
      const rtx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'register',
        args: [regForUser as `0x${string}`, Number(regReferrer), amtWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: rtx });
      tx('User registered! ✓');
      regForUser = regReferrer = regAmount = '';
      dispatch('refresh');
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }

  async function grantPackage() {
    if (!grantUser || !grantAmount) { tx('Fill user and amount', true); return; }
    tx('Granting package…');
    try {
      const amtWei   = parseUnits(grantAmount, 18);
      const limitWei = grantLimit
        ? parseUnits(grantLimit, 18)
        : amtWei * BigInt(workingMult);
      const gtx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi, functionName: 'grantPackage',
        args: [grantUser as `0x${string}`, amtWei, limitWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: gtx });
      tx('Package granted! ✓');
      grantUser = grantAmount = grantLimit = '';
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }
</script>

<div class="space-y-5">

  <!-- Register new user -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold gold-text">Register New User</h3>
    <p class="mb-4 text-xs text-text-muted">
      Registers a wallet with referrer and initial investment. Admin pays USDT.
    </p>
    <div class="flex flex-col gap-3">
      <input type="text" bind:value={regForUser} placeholder="User wallet address (0x…)"
        class="rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none"
        style="background:var(--color-surface-3)" />
      <div class="flex gap-3">
        <input type="number" bind:value={regReferrer} placeholder="Referrer ID"
          class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
        <input type="number" bind:value={regAmount} placeholder="Amount (USDT)"
          class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
      </div>
      <button on:click={adminRegister} disabled={txLoading} class="btn-primary py-2.5">
        {txLoading ? 'Processing…' : 'Register User'}
      </button>
    </div>
  </div>

  <!-- Grant package -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold text-text-primary">Grant Free Package</h3>
    <p class="mb-4 text-xs text-text-muted">
      Issues a package without USDT transfer. Working limit defaults to {workingMult}× amount.
    </p>
    <div class="flex flex-col gap-3">
      <input type="text" bind:value={grantUser} placeholder="User wallet address (0x…)"
        class="rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none"
        style="background:var(--color-surface-3)" />
      <div class="flex gap-3">
        <input type="number" bind:value={grantAmount} placeholder="Package amount (USDT)"
          class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
        <input type="number" bind:value={grantLimit}
          placeholder="Custom limit (opt.)"
          class="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
      </div>
      <button on:click={grantPackage} disabled={txLoading} class="btn-primary py-2.5">
        {txLoading ? 'Processing…' : 'Grant Package'}
      </button>
    </div>
  </div>
</div>
