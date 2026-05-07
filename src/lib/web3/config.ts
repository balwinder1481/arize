import { browser } from '$app/environment';
import { bscTestnet, bsc } from '@wagmi/core/chains';
import { env } from '$lib/constants/env';
import type { AppKit } from '@reown/appkit';
import type { Config } from '@wagmi/core';

export const projectId   = '524a91bac151d2a9895eb31b99ca24c9';
export const activeChain = env.isMainnet ? bsc : bscTestnet;

let _appKit!:      AppKit;
let _wagmiConfig!: Config;

export async function initWeb3(): Promise<void> {
  if (!browser || _wagmiConfig) return;

  const [{ createAppKit }, { WagmiAdapter }] = await Promise.all([
    import('@reown/appkit'),
    import('@reown/appkit-adapter-wagmi'),
  ]);

  const adapter = new WagmiAdapter({
    projectId,
    networks: [activeChain],
    ssr: false,
  });

  _appKit = createAppKit({
    adapters:       [adapter],
    projectId,
    networks:       [activeChain],
    defaultNetwork: activeChain,
    metadata: {
      name:        'ArizeBiz',
      description: 'Decentralized Investment Platform on BNB Chain',
      url:         'https://arizebiz.com',
      icons:       ['https://arizebiz.com/logo.png'],
    },
    features: { analytics: false, email: false, socials: [] },
    themeMode: 'dark',
    themeVariables: {
      '--apkt-accent':               '#f59e0b',
      '--apkt-color-mix':            '#d97706',
      '--apkt-color-mix-strength':   8,
      '--apkt-border-radius-master': '12px',
      '--apkt-font-family':          'Inter, system-ui, sans-serif',
      '--apkt-z-index':               1000,
    },
  });

  _wagmiConfig = adapter.wagmiConfig;
}

export function getAppKit()      { return _appKit; }
export function getWagmiConfig() { return _wagmiConfig; }
