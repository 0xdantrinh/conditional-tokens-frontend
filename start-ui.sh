#!/bin/bash

# Startup script for Conditional Tokens Prediction Market UI
# This script starts the development server with the proper Node.js options

echo "🚀 Starting Conditional Tokens Prediction Market UI..."
echo ""
echo "📍 Network: Base Sepolia (Chain ID: 84532)"
echo "🔗 LMSR Market Maker: 0x8aD1D38B26FeCF788eCF8A3aa36a93eaCb26Ce3C"
echo ""
echo "⚠️  Make sure to:"
echo "   1. Connect your wallet to Base Sepolia network"
echo "   2. Have some test ETH in your wallet for gas fees"
echo ""
echo "Starting development server..."
echo ""

NODE_OPTIONS=--openssl-legacy-provider npm start
