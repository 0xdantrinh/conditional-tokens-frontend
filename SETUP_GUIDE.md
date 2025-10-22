# 🎯 Prediction Market UI - Setup Complete!

## ✅ Setup Summary

Your prediction market UI is now configured and running on **Base Sepolia** testnet!

### 📋 Quick Start

The development server is currently running at: **http://localhost:3000**

Your browser should have automatically opened to the application. If not, navigate to `http://localhost:3000` in your browser.

---

## 🔗 Contract Addresses (Base Sepolia)

| Contract                       | Address                                      |
| ------------------------------ | -------------------------------------------- |
| **ConditionalTokens**          | `0x2485eaB838e7ECc79CC6cEB3534104b3A34B4d27` |
| **WETH9**                      | `0x1ac2b9d49305237c024Df663e5bdBa0EbDc10394` |
| **LMSR Market Maker Instance** | `0x8aD1D38B26FeCF788eCF8A3aa36a93eaCb26Ce3C` |
| **LMSRMarketMakerFactory**     | `0x799b6EB7c68D01Cb0747A689D340C7E90324BC61` |
| **Fixed192x64Math**            | `0xEBD2F9039253d97aA57011a78f68d3997a500EdF` |

---

## 🦊 MetaMask Configuration

### Add Base Sepolia Network to MetaMask:

1. Open MetaMask
2. Click on the network dropdown (top of the extension)
3. Click "Add Network" or "Add Network Manually"
4. Enter the following details:

   - **Network Name:** Base Sepolia
   - **RPC URL:** `https://sepolia.base.org`
   - **Chain ID:** `84532`
   - **Currency Symbol:** ETH
   - **Block Explorer URL:** `https://sepolia.basescan.org`

5. Click "Save"
6. Switch to Base Sepolia network

### Get Test ETH

You'll need Base Sepolia ETH for gas fees. Get some from:

- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- Or bridge from Sepolia ETH using [Base Bridge](https://bridge.base.org/)

---

## 🚀 Using the Application

### 1. Connect Your Wallet

- Click the **"Connect"** button in the UI
- Select your wallet provider (MetaMask, WalletConnect, etc.)
- Approve the connection request
- Make sure you're on Base Sepolia network

### 2. Account Types

The application recognizes three types of accounts:

- **Operator** (`0x25a86Ed6635618c979Ccb8adA3F6a16555CBb827`): Can fund markets
- **Oracle** (`0x25a86Ed6635618c979Ccb8adA3F6a16555CBb827`): Can resolve markets
- **Trader**: Any other address - can buy/sell positions

### 3. Trading on the Market

Once connected, you can:

- **Buy positions** on market outcomes (Yes/No)
- **Sell positions** you own
- View your current positions and balances
- See the current market prices (determined by LMSR algorithm)

### 4. Wrap ETH to WETH

Before trading, you'll need WETH (Wrapped ETH) as collateral:

- The UI should have a button to wrap ETH to WETH
- Approve the transaction in your wallet
- Wait for confirmation

### 5. Trade Positions

- Select the outcome you want to buy (Yes or No)
- Enter the amount of positions you want
- Approve the transaction
- Your position will appear in your balances

---

## 🛠️ Development Commands

### Start the Application

```bash
# Option 1: Use the startup script (recommended)
./start-ui.sh

# Option 2: Use npm directly
NODE_OPTIONS=--openssl-legacy-provider npm start
```

### Stop the Application

Press `Ctrl+C` in the terminal where the dev server is running

### Other Commands

```bash
# Run tests
npm test

# Build for production
npm run build

# Format code
npm run prettier
```

---

## 📁 Project Structure

```
conditional-tokens-frontend/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Main app component
│   │   ├── Market/              # Market trading interface
│   │   └── Web3Connect/         # Wallet connection
│   ├── logic/
│   │   ├── contracts.ts         # Contract loading logic
│   │   ├── ConditionalTokens/   # Conditional tokens logic
│   │   └── MarketMakers/        # Market maker logic
│   ├── conf/
│   │   └── config.local.json    # Network & contract config
│   └── abi/                     # Contract ABIs
├── .env                         # Environment variables
├── start-ui.sh                  # Startup script
└── DEPLOYMENT_INFO.md           # Contract deployment details
```

---

## ⚙️ Configuration Files

### `.env`

Contains environment variables including:

- Network configuration (Base Sepolia)
- Operator and Oracle addresses
- Node.js options for compatibility

### `src/conf/config.local.json`

Contains:

- Network ID (84532 for Base Sepolia)
- LMSR Market Maker address
- Market questions and outcomes

---

## 🐛 Troubleshooting

### Issue: "Please connect to Base Sepolia"

**Solution:** Make sure your wallet is connected to Base Sepolia network (Chain ID: 84532)

### Issue: "Insufficient WETH balance"

**Solution:** You need to wrap ETH to WETH first. Look for a "Wrap ETH" button in the UI.

### Issue: Transaction fails

**Solution:**

- Make sure you have enough ETH for gas fees
- Check that you have approved the WETH token for spending
- Verify you're connected to the correct network

### Issue: "Cannot create instance of LMSRMarketMaker; no code at address"

**This is the most common issue!**

**Cause:** Your wallet is connected to the wrong network.

**Solution:**

1. Open MetaMask
2. **Switch to Base Sepolia network** (Chain ID: 84532)
3. Refresh the browser page (F5)
4. Reconnect your wallet by clicking "Connect"

**Verify you're on the correct network:**

- Network name should show "Base Sepolia" in MetaMask
- Chain ID should be 84532
- You should have Base Sepolia ETH (not mainnet ETH)

### Issue: "contracts is required" error

**Cause:** App couldn't load contracts, usually because wrong network is selected

**Solution:**

1. Disconnect your wallet (click "Disconnect" button)
2. Switch MetaMask to Base Sepolia network
3. Refresh the page
4. Click "Connect" again

### Issue: "Web3 not detected"

**Solution:** Install MetaMask or another Web3 wallet browser extension

### Issue: Development server won't start

**Solution:** Make sure to use the startup script or run with `NODE_OPTIONS=--openssl-legacy-provider npm start`

---

## 🔍 View Transactions

All transactions can be viewed on Base Sepolia block explorer:

- **Block Explorer:** https://sepolia.basescan.org
- **Your Market Maker:** https://sepolia.basescan.org/address/0x8aD1D38B26FeCF788eCF8A3aa36a93eaCb26Ce3C

---

## 📚 Additional Resources

- [Conditional Tokens Documentation](https://docs.gnosis.io/conditionaltokens/)
- [LMSR Market Maker](https://docs.gnosis.io/conditionaltokens/docs/introduction3/)
- [Base Sepolia Documentation](https://docs.base.org/)

---

## ⚠️ Important Notes

- This is a **testnet application** using Base Sepolia
- Do NOT send real funds to these contracts
- The operator and oracle accounts use the mnemonic in `.env` - **DO NOT USE IN PRODUCTION**
- For production use, implement proper key management and security measures

---

## 🎉 You're All Set!

Your prediction market UI is now running and connected to your deployed contracts on Base Sepolia.

**Next Steps:**

1. Open http://localhost:3000 in your browser
2. Connect your wallet to Base Sepolia
3. Get some test ETH from a faucet
4. Start trading!

Happy trading! 🚀
