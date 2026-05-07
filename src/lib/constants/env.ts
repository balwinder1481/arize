// ============================================
// NETWORK CONFIGURATION — change here to switch
// ============================================
const IS_MAINNET = true;

const TESTNET_CONFIG = {
  chainId: 97,
  chainName: 'BNB Smart Chain Testnet',
  contracts: {
    arizeBizProxy: '0xc8e068917B03b2acc4f8480463007f18605C2472',
    arizeBizHub:   '0x1D3cCe0a42578DCDfC18D6Def7B8E6B70cC7fFCA',
    usdt:          '0x118C50F7746EC40505C0CeAcA9cAA0865346c67a',
  },
  admins: [
    '0xd74BDe2C6aeaFdDbFcB3698bF010f82F683b22Cf',
    '0x4263e80e1CF23F6b232818f6a087cD41B924EC30',
  ],
  rpcUrls: [
    'https://bsc-testnet-rpc.publicnode.com',
    'https://rpc.ankr.com/bsc_testnet_chapel',
  ],
};

const MAINNET_CONFIG = {
  chainId: 56,
  chainName: 'BNB Smart Chain',
  contracts: {
    arizeBizProxy: '0x63420A496e5689A9164f777c2Bf107cC5AD92898',
    arizeBizHub:   '0x5143d2960e6722BDe21c37a97a3Ba34D3f30db85',
    usdt:          '0x55d398326f99059fF775485246999027B3197955',
  },
  admins: [
    '0xd74BDe2C6aeaFdDbFcB3698bF010f82F683b22Cf',
    '0x269eef12e04f7af4f93924f50b99150f5db07464',
  ],
  rpcUrls: [
    'https://bsc-rpc.publicnode.com',
    'https://rpc.ankr.com/bsc',
  ],
};

const ACTIVE = IS_MAINNET ? MAINNET_CONFIG : TESTNET_CONFIG;

export const env = {
  isMainnet: IS_MAINNET,
  chainId: ACTIVE.chainId,
  chainName: ACTIVE.chainName,
  contracts: ACTIVE.contracts,
  admins: ACTIVE.admins,
  rpcUrl: ACTIVE.rpcUrls[0],
  rpcUrls: ACTIVE.rpcUrls,
  walletConnectProjectId: 'cb9711b1986838aaa829eb1cd9dc0163',
} as const;
