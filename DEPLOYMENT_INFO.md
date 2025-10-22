# Deployment Information

## Base Sepolia Network

**Network ID:** 84532  
**RPC URL:** https://sepolia.base.org  
**Block Explorer:** https://sepolia.basescan.org/

## Deployed Contracts

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| ConditionalTokens          | `0x2485eaB838e7ECc79CC6cEB3534104b3A34B4d27` |
| Fixed192x64Math            | `0xEBD2F9039253d97aA57011a78f68d3997a500EdF` |
| LMSRMarketMakerFactory     | `0x799b6EB7c68D01Cb0747A689D340C7E90324BC61` |
| LMSRMarketMaker            | `0xA4e1c2289d1031F01FC899AD329154253ccD788d` |
| WETH9                      | `0x1ac2b9d49305237c024Df663e5bdBa0EbDc10394` |
| LMSR Market Maker Instance | `0x8aD1D38B26FeCF788eCF8A3aa36a93eaCb26Ce3C` |

## View on Block Explorer

- [ConditionalTokens](https://sepolia.basescan.org/address/0x2485eaB838e7ECc79CC6cEB3534104b3A34B4d27)
- [WETH9](https://sepolia.basescan.org/address/0x1ac2b9d49305237c024Df663e5bdBa0EbDc10394)
- [LMSR Market Maker Instance](https://sepolia.basescan.org/address/0x8aD1D38B26FeCF788eCF8A3aa36a93eaCb26Ce3C)

## Configuration

The UI is configured to connect to these contracts on Base Sepolia. Make sure to:

1. Connect your wallet to Base Sepolia network
2. Use the addresses above when interacting with the contracts
3. The LMSR Market Maker Instance address (`0x8aD1D38B26FeCF788eCF8A3aa36a93eaCb26Ce3C`) is configured in `src/conf/config.local.json`

## Accounts

- **Operator Address:** `0x25a86Ed6635618c979Ccb8adA3F6a16555CBb827`
- **Oracle Address:** `0x25a86Ed6635618c979Ccb8adA3F6a16555CBb827`

## How to Add Base Sepolia to MetaMask

If you need to manually add Base Sepolia to your wallet:

- **Network Name:** Base Sepolia
- **RPC URL:** https://sepolia.base.org
- **Chain ID:** 84532
- **Currency Symbol:** ETH
- **Block Explorer URL:** https://sepolia.basescan.org
