import ConditionalTokensABI from '../abi/ConditionalTokens.json'
import LMSRMarketMakerABI from '../abi/LMSRMarketMaker.json'
import WETH9ABI from '../abi/WETH9.json'

let contracts: Object | undefined
let lmsrAddressCache: string | undefined
let providerAccountCache: string | undefined

const resetContracts = () => {
  contracts = undefined
  lmsrAddressCache = undefined
  providerAccountCache = undefined
}

// Helper to extract ABI from Forge or Truffle format
const getABI = (artifact: any) => {
  // If it's already just an ABI array, return it
  if (Array.isArray(artifact)) {
    return artifact
  }
  // If it has an abi field (Forge/Truffle format), extract it
  if (artifact.abi) {
    return artifact.abi
  }
  throw new Error('Invalid contract artifact format')
}

const loadLMSRMarketMakerContract = async (web3: any, address: string) => {
  try {
    const abi = getABI(LMSRMarketMakerABI)
    return new web3.eth.Contract(abi, address)
  } catch (error) {
    console.error('Error loading LMSR Market Maker contract:', error)
    return null
  }
}

const loadConditionalTokensContract = async (web3: any, address: string) => {
  try {
    const abi = getABI(ConditionalTokensABI)
    return new web3.eth.Contract(abi, address)
  } catch (error) {
    console.error('Error loading Conditional Tokens contract:', error)
    return null
  }
}

const loadWETH9Contract = async (web3: any, address: string) => {
  try {
    const abi = getABI(WETH9ABI)
    return new web3.eth.Contract(abi, address)
  } catch (error) {
    console.error('Error loading WETH9 contract:', error)
    return null
  }
}

const loadContracts = async (web3: any, lmsrAddress: string, account: string) => {
  try {
    if (
      (account && account !== providerAccountCache) ||
      (lmsrAddress && lmsrAddress !== lmsrAddressCache)
    ) {
      resetContracts()
    }
    if (!contracts) {
      providerAccountCache = account
      lmsrAddressCache = lmsrAddress

      // Load config to get centralized contract addresses
      const config = require('../conf/config.local.json')
      const pmSystemAddress = config.contracts.conditionalTokens
      const collateralTokenAddress = config.contracts.collateralToken

      console.log('Using ConditionalTokens from config:', pmSystemAddress)
      console.log('Using CollateralToken from config:', collateralTokenAddress)
      console.log('Using LMSR address:', lmsrAddress)

      // Create LMSR Market Maker contract instance
      console.log('Loading LMSR contract at:', lmsrAddress)
      const lmsrMarketMaker = await loadLMSRMarketMakerContract(web3, lmsrAddress)
      if (!lmsrMarketMaker) {
        console.error('Failed to create LMSR contract instance at', lmsrAddress)
        throw new Error('Failed to load LMSR Market Maker contract')
      }
      console.log('✅ LMSR contract loaded successfully')

      // Create Conditional Tokens contract instance
      const conditionalTokens = await loadConditionalTokensContract(web3, pmSystemAddress)
      if (!conditionalTokens) {
        throw new Error('Failed to load Conditional Tokens contract')
      }

      // Create WETH9 contract instance
      const collateralTokenContract = await loadWETH9Contract(web3, collateralTokenAddress)
      if (!collateralTokenContract) {
        throw new Error('Failed to load WETH9 contract')
      }

      const collateralToken = {
        address: collateralTokenAddress,
        contract: collateralTokenContract,
        name: 'Wrapped Ether',
        decimals: 18,
        symbol: 'WETH',
      }

      contracts = {
        lmsrMarketMaker,
        conditionalTokens,
        collateralToken,
        account: providerAccountCache,
      }
    }
    return contracts
  } catch (err) {
    console.error(err)
    return null
  }
}

export default loadContracts
