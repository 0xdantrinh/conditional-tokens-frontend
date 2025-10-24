export const UMA_CONFIG = {
  BASE_SEPOLIA: {
    chainId: 84532,
    umaCtfAdapter: '0xaB4C96bF8C919838CdDA7Cf0288c477FA2f6b0F4',
    conditionalTokens: '0x9E3c7A35e4a6500e62E3E8D2c24e71F5F37107A9',
    optimisticOracle: '0x99EC530a761E68a377593888D9504002Bd191717',
    rewardToken: '0x7E6d9618Ba8a87421609352d6e711958A97e2512', // TestnetERC20
    // UmaCtfAdapter deployment block on Base Sepolia
    startBlock: 32780034,
    // Oracle parameters
    priceIdentifier: '0x5945535f4f525f4e4f5f51554552590000000000000000000000000000000000', // "YES_OR_NO_QUERY"
    // Answer values for binary questions (as strings for BigInt conversion)
    ANSWER_YES: '1000000000000000000', // 1e18 (100% = YES)
    ANSWER_NO: '0', // 0 (0% = NO)
    ANSWER_UNDECIDED: '500000000000000000', // 0.5e18 (50% = UNDECIDED)
  },
  BASE_MAINNET: {
    chainId: 8453,
    umaCtfAdapter: '', // TODO: Deploy to mainnet
    conditionalTokens: '',
    optimisticOracle: '0x880d041D67aaB3B062995d11d4aD9c1018A3b02f',
    rewardToken: '',
    startBlock: 0,
    priceIdentifier: '0x5945535f4f525f4e4f5f51554552590000000000000000000000000000000000',
    ANSWER_YES: '1000000000000000000',
    ANSWER_NO: '0',
    ANSWER_UNDECIDED: '500000000000000000',
  },
} as const
