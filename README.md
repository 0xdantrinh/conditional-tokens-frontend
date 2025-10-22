# 🔮 Prediction Markets Platform

Decentralized prediction markets powered by Conditional Tokens on Base Sepolia.

## Features

- **16 Prediction Markets** across 8 categories (Crypto, Politics, Technology, Sports, Entertainment, Science, Business, Climate)
- **Category Filtering** - Browse markets by topic
- **Individual Market Makers** - Each market has its own LMSR instance with independent liquidity
- **Real-time Trading** - Buy/Sell outcome tokens with automated market maker pricing
- **Role-Based Actions** - Trader, Operator, and Oracle capabilities

## Quick Start

### Prerequisites

- Node.js v14+
- MetaMask or Web3 wallet
- Base Sepolia ETH ([Get from faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet))

### Installation

```bash
npm install
```

### Start Development Server

```bash
./start-ui.sh
```

Or manually:

```bash
NODE_OPTIONS=--openssl-legacy-provider npm start
```

Opens at [http://localhost:3000](http://localhost:3000)

### Connect to Base Sepolia

1. Open MetaMask
2. Add Base Sepolia network:
   - **Network Name:** Base Sepolia
   - **RPC URL:** `https://sepolia.base.org`
   - **Chain ID:** `84532`
   - **Currency:** ETH
   - **Block Explorer:** `https://sepolia.basescan.org`
3. Switch to Base Sepolia
4. Click "Connect" in the app

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| ConditionalTokens | `0x2485eaB838e7ECc79CC6cEB3534104b3A34B4d27` |
| WETH9 (Collateral) | `0x1ac2b9d49305237c024Df663e5bdBa0EbDc10394` |
| LMSRMarketMakerFactory | `0x799b6EB7c68D01Cb0747A689D340C7E90324BC61` |

**16 Market Makers** - See `src/conf/config.local.json` for all addresses

[View on Base Sepolia Explorer](https://sepolia.basescan.org)

## Markets

### Crypto (3)
- Will Bitcoin reach $150,000 by end of 2025?
- Will Ethereum successfully complete 'The Surge' upgrade in 2025?
- Will Base network TVL exceed $10 billion in 2025?

### Politics (2)
- Will the US approve a Bitcoin Strategic Reserve in 2025?
- Will the EU pass comprehensive AI regulation before 2026?

### Technology (2)
- Will GPT-5 be released by OpenAI in 2025?
- Will Apple release an AI-powered HomePod in 2025?

### Sports (1)
- Will an NBA team win 70+ games in the 2025-26 season?

### Entertainment (1)
- Will a streaming service surpass Netflix in global subscribers by 2026?

### Science (2)
- Will SpaceX successfully land humans on Mars by 2030?
- Will a quantum computer achieve quantum advantage in drug discovery by 2026?

### Business (2)
- Will Tesla's market cap exceed $1 trillion in 2025?
- Will any company achieve a $5 trillion market cap by 2026?

### Climate (3)
- Will 2025 be recorded as the hottest year on record?
- Will global renewable energy capacity exceed 50% by 2026?
- Legacy weather market

## How to Use

### 1. Browse Markets
- Use category filters to narrow down markets
- Click tabs to view different markets
- Read market descriptions and resolution criteria

### 2. Trade
1. Wrap ETH to WETH (collateral token)
2. Select an outcome (Yes/No)
3. Enter amount
4. Click Buy or Sell
5. Approve transaction in MetaMask

### 3. Track Positions
- View your balances for each outcome
- See real-time probability updates
- Monitor market status

### 4. Redeem Winnings
- After market resolution, click "Redeem"
- Receive WETH for winning positions

## Architecture

```
ConditionalTokens
  ├─ 16 Conditions (one per market)
  └─ ERC-1155 position tokens

WETH9
  └─ Collateral for all markets

LMSRMarketMakerFactory
  └─ Creates market makers

16 LMSR Market Makers
  └─ Independent liquidity pools
```

## Development

### Available Scripts

#### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

#### `npm test`
Launches the test runner

#### `npm run build`
Builds the app for production to the `build` folder

#### `npm run prettier`
Formats code with Prettier

## Troubleshooting

### Error: "Cannot create instance of LMSRMarketMaker"

**Solution:** Your wallet is not connected to Base Sepolia. Switch networks in MetaMask and refresh.

### Error: "contracts is required"

**Solution:** Wrong network. Make sure you're on Base Sepolia (Chain ID: 84532).

### Transaction fails

**Solution:**
- Ensure you have Base Sepolia ETH for gas
- Approve WETH spending first
- Check you're on the correct network

See `SETUP_GUIDE.md` for detailed troubleshooting.

## Project Structure

```
src/
├── components/
│   ├── App.tsx              # Main app with network detection
│   ├── MarketsList/         # Multi-market browser
│   ├── Market/              # Individual market trading
│   └── Web3Connect/         # Wallet connection
├── logic/
│   ├── contracts.ts         # Contract loading
│   ├── ConditionalTokens/   # CT integration
│   └── MarketMakers/        # MM integration
├── conf/
│   └── config.local.json    # Market configs & addresses
└── abi/                     # Contract ABIs
```

## Tech Stack

- **Frontend:** React + TypeScript + Material-UI
- **Blockchain:** Ethereum (Base Sepolia)
- **Contracts:** Gnosis Conditional Tokens + LMSR Market Maker
- **Web3:** Web3.js + WalletConnect

## Resources

- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [Deployment Info](DEPLOYMENT_INFO.md) - Contract addresses
- [Conditional Tokens Docs](https://docs.gnosis.io/conditionaltokens/)
- [Base Documentation](https://docs.base.org/)

## License

MIT

---

**Network:** Base Sepolia (Testnet)  
**Chain ID:** 84532  
**Status:** ✅ Active
