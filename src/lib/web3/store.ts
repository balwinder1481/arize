import { writable, derived } from 'svelte/store';
import { initWeb3, getAppKit, getWagmiConfig } from './config';
import {
  disconnect,
  getAccount,
  watchAccount,
  reconnect,
  switchChain,
  readContract,
  writeContract,
  waitForTransactionReceipt,
  getPublicClient,
} from '@wagmi/core';
import type { Address } from 'viem';

// wagmiConfig exported as mutable let — populated after initWeb3() resolves
export let wagmiConfig: ReturnType<typeof getWagmiConfig> = undefined as never;

// ─── Account state ──────────────────────────────────────────
export const account = writable<{
  address: Address | undefined;
  isConnected: boolean;
  chainId: number | undefined;
}>({
  address: undefined,
  isConnected: false,
  chainId: undefined,
});

export const address     = derived(account, ($a) => $a.address);
export const isConnected = derived(account, ($a) => $a.isConnected);
export const chainId     = derived(account, ($a) => $a.chainId);

// ─── Watch account changes (client only) ────────────────────
if (typeof window !== 'undefined') {
  initWeb3().then(() => {
    const cfg = getWagmiConfig();
    if (!cfg) return;
    wagmiConfig = cfg;
    reconnect(cfg).then(() => {
      const initial = getAccount(cfg);
      account.set({ address: initial.address, isConnected: initial.isConnected, chainId: initial.chainId });
    });
    watchAccount(cfg, {
      onChange(data) {
        account.set({ address: data.address, isConnected: data.isConnected, chainId: data.chainId });
      },
    });
  });
}

// ─── Actions ────────────────────────────────────────────────
export async function connectWallet() {
  await getAppKit()?.open();
}

export async function disconnectWallet() {
  await getAppKit()?.disconnect();
}

export async function switchNetwork(id: number) {
  if (wagmiConfig) await switchChain(wagmiConfig, { chainId: id as never });
}

// ─── Contract helpers ────────────────────────────────────────
export { readContract, writeContract, waitForTransactionReceipt, getPublicClient };

// ─── writeContract with explicit gas estimation ──────────────
// Estimates gas via the public client, adds 20 % buffer, then sends.
// This bypasses MetaMask's own broken estimation and surfaces revert
// reasons as proper errors rather than "gas limit too high".
export async function writeContractWithGas(
  params: Parameters<typeof writeContract>[1]
): Promise<`0x${string}`> {
  if (!wagmiConfig) throw new Error('Web3 not initialised');
  const client = getPublicClient(wagmiConfig);
  if (!client) throw new Error('No public client available');

  const { address: from } = getAccount(wagmiConfig);

  const estimated: bigint = await client.estimateContractGas({
    ...params,
    account: from,
  } as never);
  const gas = (estimated * 120n) / 100n;

  return writeContract(wagmiConfig, { ...params, gas } as never);
}
