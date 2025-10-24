export const UMA_CONFIG = {
  BASE_SEPOLIA: {
    chainId: 84532,
    umaCtfAdapter: '0xaB4C96bF8C919838CdDA7Cf0288c477FA2f6b0F4',
    conditionalTokens: '0x9E3c7A35e4a6500e62E3E8D2c24e71F5F37107A9',
    optimisticOracle: '0x99EC530a761E68a377593888D9504002Bd191717',
    // UmaCtfAdapter deployment block on Base Sepolia
    startBlock: 32780034,
  },
  BASE_MAINNET: {
    chainId: 8453,
    umaCtfAdapter: '', // TODO: Deploy to mainnet
    conditionalTokens: '',
    optimisticOracle: '0x880d041D67aaB3B062995d11d4aD9c1018A3b02f',
    startBlock: 0,
  },
} as const
