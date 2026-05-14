<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writeContractWithGas, waitForTransactionReceipt, wagmiConfig } from '$lib/web3/store';
  import { arizeBizV2Abi } from '$lib/contracts';
  import { env } from '$lib/constants/env';
  import { parseUnits, formatUnits } from 'viem';
  import type { ContractConfig } from '$lib/types/admin';

  export let cfg: ContractConfig = {} as ContractConfig;
  export let txLoading = false;

  const dispatch = createEventDispatcher<{
    refresh: void;
    txStatus: { msg: string; err: boolean };
  }>();

  const PROXY = env.contracts.arizeBizProxy as `0x${string}`;

  let cfgField = '';
  let cfgValue = '';
  let rankTargets: (string | number)[] = Array(10).fill('');
  let rankPerDay: (string | number)[] = Array(10).fill('');

  async function updateRank(level: number) {
    if (!rankTargets[level] || !rankPerDay[level]) return;
    tx(`Updating Rank ${level + 1}…`);
    try {
      const target = parseUnits(String(rankTargets[level]), 18);
      const perDay = parseUnits(String(rankPerDay[level]), 18);
      
      await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'setRankTarget', args: [level, target],
      });
      await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi,
        functionName: 'setRankPerDay', args: [level, perDay],
      });
      
      tx(`Rank ${level + 1} updated! ✓`);
      rankTargets[level] = '';
      rankPerDay[level] = '';
      dispatch('refresh');
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }

  const configFields = [
    { value:'dailyRoi',    label:'Daily ROI (bps — e.g. 50 = 0.5%)',      hint: `Current: ${cfg.dRoiPer} bps` },
    { value:'directRef',   label:'Direct Ref % (bps)',                     hint: `Current: ${cfg.directRefPer} bps` },
    { value:'minInvest',   label:'Min Invest (USDT)',                      hint: `Current: $${Number(formatUnits(cfg.minInvest, 18)).toFixed(2)}` },
    { value:'minWithdraw', label:'Min Withdraw (USDT)',                    hint: `Current: $${Number(formatUnits(cfg.minWithdraw, 18)).toFixed(2)}` },
    { value:'withdrawFee', label:'Withdraw Fee (bps)',                     hint: `Current: ${cfg.withdrawFee} bps` },
    { value:'workingMult', label:'Working Multiplier (e.g. 3)',            hint: `Current: ${cfg.workingMult}×` },
    { value:'dayLength',   label:'Day Length (seconds)',                   hint: `Current: ${cfg.dayLength}s` },
    { value:'feeReceiver', label:'Fee Receiver (address)',                 hint: '' },
    { value:'rankTarget',  label:'Rank Target (level:0-9,amount)',         hint: 'Format: 0,2500 for L1 $2.5K' },
    { value:'rankPerDay',  label:'Rank Per Day (level:0-9,amount)',        hint: 'Format: 0,5 for L1 $5/day' },
  ];

  function tx(msg: string, err = false) { dispatch('txStatus', { msg, err }); }

  async function setConfig() {
    if (!cfgField || !cfgValue) { tx('Select a field and enter a value', true); return; }
    tx(`Updating ${cfgField}…`);
    try {
      let fn: string;
      let val: unknown;
      switch (cfgField) {
        case 'dailyRoi':    fn = 'setDailyRoi';          val = Number(cfgValue);         break;
        case 'directRef':   fn = 'setDirectRefPer';      val = Number(cfgValue);         break;
        case 'minInvest':   fn = 'setMinInvest';         val = parseUnits(cfgValue, 18); break;
        case 'minWithdraw': fn = 'setMinWithdraw';       val = parseUnits(cfgValue, 18); break;
        case 'withdrawFee': fn = 'setWithdrawFee';       val = Number(cfgValue);         break;
        case 'workingMult': fn = 'setWorkingMultiplier'; val = Number(cfgValue);         break;
        case 'dayLength':   fn = 'setDayLength';         val = Number(cfgValue);         break;
        case 'feeReceiver': fn = 'setFeeReceiver';       val = cfgValue as `0x${string}`; break;
        case 'rankTarget': {
          const [lvl, amt] = cfgValue.split(',').map(s => s.trim());
          fn = 'setRankTarget';
          val = [Number(lvl), parseUnits(amt, 18)];
          break;
        }
        case 'rankPerDay': {
          const [lvl, amt] = cfgValue.split(',').map(s => s.trim());
          fn = 'setRankPerDay';
          val = [Number(lvl), parseUnits(amt, 18)];
          break;
        }
        default: tx('Unknown field', true); return;
      }
      const t = await writeContractWithGas({
        address: PROXY, abi: arizeBizV2Abi,
        functionName: fn as never,
        args: Array.isArray(val) ? val : [val],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash: t });
      tx(`${cfgField} updated! ✓`);
      cfgField = cfgValue = '';
      dispatch('refresh');
    } catch (e: unknown) { tx(e instanceof Error ? e.message : 'Failed', true); }
  }
</script>

<div class="space-y-5">
  <div class="card p-5">
    <h3 class="mb-1 font-bold gold-text">Update Contract Config</h3>
    <p class="mb-4 text-xs text-text-muted">
      Changes are on-chain and immediate. Double-check values before submitting.
    </p>

    <!-- Field selector -->
    <div class="mb-4 grid gap-3 sm:grid-cols-2">
      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="mb-1.5 block text-xs text-text-muted font-medium">Parameter</label>
        <select bind:value={cfgField}
          class="w-full rounded-xl border border-border px-3 py-2.5 text-sm
                 text-text-primary outline-none"
          style="background:var(--color-surface-3)">
          <option value="">— Select parameter —</option>
          {#each configFields as f}
            <option value={f.value}>{f.label}</option>
          {/each}
        </select>
        {#if cfgField}
          {@const hint = configFields.find(f => f.value === cfgField)?.hint}
          {#if hint}
            <p class="mt-1 text-xs text-text-muted">{hint}</p>
          {/if}
        {/if}
      </div>
      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="mb-1.5 block text-xs text-text-muted font-medium">New Value</label>
        <input type="text" bind:value={cfgValue}
          placeholder={cfgField === 'feeReceiver' ? '0x…' : 'Enter value'}
          class="w-full rounded-xl border border-border px-3 py-2.5 text-sm
                 text-text-primary outline-none focus:border-gold"
          style="background:var(--color-surface-3)" />
      </div>
    </div>

    <button on:click={setConfig} disabled={txLoading || !cfgField || !cfgValue}
            class="btn-primary w-full py-2.5">
      {txLoading ? 'Updating…' : 'Update Parameter'}
    </button>
  </div>

  <!-- Current values reference card -->
  <div class="card p-5">
    <h3 class="mb-3 text-sm font-bold text-text-muted uppercase tracking-wide">Current Values</h3>
    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 text-sm">
      {#each [
        { k:'Daily ROI',      v:`${cfg.dRoiPer/100}% (${cfg.dRoiPer} bps)` },
        { k:'Direct Ref',     v:`${cfg.directRefPer/100}% (${cfg.directRefPer} bps)` },
        { k:'Min Invest',     v:`$${Number(formatUnits(cfg.minInvest, 18)).toFixed(2)}` },
        { k:'Min Withdraw',   v:`$${Number(formatUnits(cfg.minWithdraw, 18)).toFixed(2)}` },
        { k:'Withdraw Fee',   v:`${cfg.withdrawFee/100}% (${cfg.withdrawFee} bps)` },
        { k:'Working Mult',   v:`${cfg.workingMult}×` },
        { k:'ROI Mult',       v:`${cfg.roiMult}×` },
        { k:'Day Length',     v:`${cfg.dayLength}s (${(cfg.dayLength/3600).toFixed(1)}h)` },
      ] as p}
        <div class="rounded-xl px-3 py-2.5" style="background:var(--color-surface-3)">
          <div class="text-xs text-text-muted">{p.k}</div>
          <div class="mt-0.5 font-semibold text-text-primary">{p.v}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Rank Configuration Section -->
  <div class="card p-5" style="border-color:rgba(167,139,250,0.3)">
    <h3 class="mb-1 font-bold" style="color:#a78bfa">Rank Configuration</h3>
    <p class="mb-4 text-xs text-text-muted">Set target business and daily salary for each rank level</p>
    
    <div class="space-y-3">
      {#each [0,1,2,3,4,5,6,7,8,9] as i}
        <div class="flex flex-wrap items-center gap-3 p-3 rounded-xl" style="background:var(--color-surface-3)">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:rgba(167,139,250,0.2); color:#a78bfa">
            L{i+1}
          </div>
          <div class="flex-1 min-w-[120px]">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-xs text-text-muted block mb-1">Target ($)</label>
            <input type="number" bind:value={rankTargets[i]} placeholder="e.g. 2500"
              class="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary outline-none focus:border-purple-400"
              style="background:var(--color-surface-4)" />
          </div>
          <div class="flex-1 min-w-[100px]">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-xs text-text-muted block mb-1">Per Day ($)</label>
            <input type="number" bind:value={rankPerDay[i]} placeholder="e.g. 5"
              class="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary outline-none focus:border-purple-400"
              style="background:var(--color-surface-4)" />
          </div>
          <button on:click={() => updateRank(i)} disabled={txLoading || !rankTargets[i] || !rankPerDay[i]}
            class="btn-primary px-4 py-2 text-sm">
            {txLoading ? '…' : 'Update'}
          </button>
        </div>
      {/each}
    </div>
  </div>
</div>
