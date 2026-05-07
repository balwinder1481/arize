<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writeContractWithGas, waitForTransactionReceipt, wagmiConfig } from '$lib/web3/store';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { parseUnits } from 'viem';

  export let txLoading = false;

  const dispatch = createEventDispatcher<{
    txStatus: { msg: string; err: boolean };
  }>();

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  // Create bonanza
  let bnName    = '';
  let bnStart   = '';
  let bnEnd     = '';
  let bnTargets = ''; // comma-separated USDT amounts
  let bnRewards = ''; // comma-separated USDT amounts

  // Pay bonanza
  let payId   = '';
  let payUser = '';

  function tx(msg: string, err = false) { dispatch('txStatus', { msg, err }); }

  async function createBonanza() {
    if (!bnName || !bnStart || !bnEnd || !bnTargets || !bnRewards) {
      tx('Fill all bonanza fields', true); return;
    }
    tx('Creating Bonanza…');
    try {
      const startTs = Math.floor(new Date(bnStart).getTime() / 1000);
      const endTs   = Math.floor(new Date(bnEnd).getTime() / 1000);
      const targets = bnTargets.split(',').map(t => parseUnits(t.trim(), 18));
      const rewards = bnRewards.split(',').map(r => parseUnits(r.trim(), 18));
      if (targets.length !== rewards.length) {
        tx('Targets and rewards must have same count', true); return;
      }
      const btx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'createBonanza',
        args: [bnName, startTs, endTs, targets, rewards],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: btx });
      tx('Bonanza created! ✓');
      bnName = bnStart = bnEnd = bnTargets = bnRewards = '';
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }

  async function payBonanza() {
    if (!payId || !payUser) { tx('Enter bonanza ID and user address', true); return; }
    tx('Paying bonanza reward…');
    try {
      const ptx = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'payBonanza',
        args: [BigInt(payId), payUser as `0x${string}`],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: ptx });
      tx('Bonanza paid! ✓');
      payId = payUser = '';
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }
</script>

<div class="space-y-5">

  <!-- Create bonanza -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold gold-text">Create Bonanza Event</h3>
    <p class="mb-4 text-xs text-text-muted">
      Set team business targets and reward amounts for each tier.
      Comma-separate multiple tiers (e.g. <code>1000,5000,10000</code>).
    </p>
    <div class="flex flex-col gap-3">
      <input type="text" bind:value={bnName} placeholder="Event name (e.g. Summer Bonanza)"
        class="rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary outline-none"
        style="background:var(--color-surface-3)" />

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="mb-1 block text-xs text-text-muted">Start Date &amp; Time</label>
          <input type="datetime-local" bind:value={bnStart}
            class="w-full rounded-xl border border-border px-3 py-2.5 text-sm
                   text-text-primary outline-none"
            style="background:var(--color-surface-3)" />
        </div>
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="mb-1 block text-xs text-text-muted">End Date &amp; Time</label>
          <input type="datetime-local" bind:value={bnEnd}
            class="w-full rounded-xl border border-border px-3 py-2.5 text-sm
                   text-text-primary outline-none"
            style="background:var(--color-surface-3)" />
        </div>
      </div>

      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="mb-1 block text-xs text-text-muted">
          Team Targets in USDT — comma separated (e.g. 1000,5000,10000)
        </label>
        <input type="text" bind:value={bnTargets} placeholder="1000,5000,10000"
          class="w-full rounded-xl border border-border px-4 py-2.5 text-sm
                 text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
      </div>

      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="mb-1 block text-xs text-text-muted">
          Reward Amounts in USDT — same number of tiers as targets
        </label>
        <input type="text" bind:value={bnRewards} placeholder="100,500,1000"
          class="w-full rounded-xl border border-border px-4 py-2.5 text-sm
                 text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
      </div>

      <!-- Preview tiers -->
      {#if bnTargets && bnRewards}
        {@const tiers = bnTargets.split(',').map(t => t.trim()).filter(Boolean)}
        {@const rews  = bnRewards.split(',').map(r => r.trim()).filter(Boolean)}
        {#if tiers.length === rews.length && tiers.length > 0}
          <div class="rounded-xl p-3" style="background:var(--color-surface-3)">
            <p class="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wide">Tier Preview</p>
            {#each tiers as target, i}
              <div class="flex justify-between text-sm py-0.5">
                <span class="text-text-secondary">Tier {i+1}: ${target} team business</span>
                <span class="gold-text font-semibold">→ ${rews[i]} reward</span>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      <button on:click={createBonanza} disabled={txLoading} class="btn-primary py-2.5">
        {txLoading ? 'Processing…' : 'Create Bonanza'}
      </button>
    </div>
  </div>

  <!-- Pay bonanza -->
  <div class="card p-5">
    <h3 class="mb-1 font-bold text-text-primary">Pay Bonanza Reward</h3>
    <p class="mb-4 text-xs text-text-muted">
      Manually trigger reward payout for a qualified user.
    </p>
    <div class="flex flex-col gap-3">
      <div class="flex gap-3">
        <input type="number" bind:value={payId} placeholder="Bonanza ID"
          class="w-28 rounded-xl border border-border px-3 py-2.5 text-sm
                 text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
        <input type="text" bind:value={payUser} placeholder="User wallet address (0x…)"
          class="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm
                 text-text-primary outline-none"
          style="background:var(--color-surface-3)" />
      </div>
      <button on:click={payBonanza} disabled={txLoading} class="btn-primary py-2.5">
        {txLoading ? 'Processing…' : 'Pay Bonanza Reward'}
      </button>
    </div>
  </div>
</div>
