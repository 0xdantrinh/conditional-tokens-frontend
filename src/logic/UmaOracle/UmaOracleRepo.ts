import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { AbiItem } from 'web3-utils'
import UmaCtfAdapterABI from 'src/abi/UmaCtfAdapter.json'
import OptimisticOracleV2ABI from 'src/abi/IOptimisticOracleV2.json'
import { UMA_CONFIG } from 'src/conf/uma'

export interface QuestionData {
  requestTimestamp: string
  reward: string
  proposalBond: string
  liveness: string
  manualResolutionTimestamp: string
  resolved: boolean
  paused: boolean
  reset: boolean
  refund: boolean
  rewardToken: string
  creator: string
  ancillaryData: string
}

export interface QuestionInitializedEvent {
  questionID: string
  requestTimestamp: string
  creator: string
  ancillaryData: string
  rewardToken: string
  reward: string
  proposalBond: string
  blockNumber: number
  transactionHash: string
}

export interface ParsedAncillaryData {
  title: string
  description: string
  resData: string
  raw: string
}

export default class UmaOracleRepo {
  private web3: Web3
  private adapter: Contract
  private optimisticOracle: Contract

  constructor(web3: Web3) {
    this.web3 = web3
    this.adapter = new web3.eth.Contract(
      UmaCtfAdapterABI.abi as AbiItem[],
      UMA_CONFIG.BASE_SEPOLIA.umaCtfAdapter,
    )
    this.optimisticOracle = new web3.eth.Contract(
      OptimisticOracleV2ABI.abi as AbiItem[],
      UMA_CONFIG.BASE_SEPOLIA.optimisticOracle,
    )
  }

  // Parse ancillary data to extract title and description
  parseAncillaryData = (ancillaryData: string): ParsedAncillaryData => {
    try {
      // Remove '0x' prefix and convert hex to string
      const hex = ancillaryData.startsWith('0x') ? ancillaryData.slice(2) : ancillaryData
      const str = this.web3.utils.hexToUtf8('0x' + hex)

      // Parse format: "q: title: X, description: Y, res_data: Z"
      const titleMatch = str.match(/title:\s*([^,]+?)(?=,\s*description:|$)/i)
      const descMatch = str.match(/description:\s*([^,]+?)(?=,\s*res_data:|$)/i)
      const resDataMatch = str.match(/res_data:\s*(.+?)$/i)

      return {
        title: titleMatch ? titleMatch[1].trim() : 'Unknown Question',
        description: descMatch ? descMatch[1].trim() : '',
        resData: resDataMatch ? resDataMatch[1].trim() : '',
        raw: str,
      }
    } catch (err) {
      console.error('Error parsing ancillary data:', err)
      return {
        title: 'Unknown Question',
        description: '',
        resData: '',
        raw: ancillaryData,
      }
    }
  }

  // Get question data by ID
  getQuestion = async (questionID: string): Promise<QuestionData> => {
    const question = await this.adapter.methods.getQuestion(questionID).call()
    return question as QuestionData
  }

  // Check if question is ready to resolve
  isReady = async (questionID: string): Promise<boolean> => {
    return await this.adapter.methods.ready(questionID).call()
  }

  // Check if question is initialized
  isInitialized = async (questionID: string): Promise<boolean> => {
    return await this.adapter.methods.isInitialized(questionID).call()
  }

  // Check if question has a price request but no proposal yet (ready to propose)
  canPropose = async (questionID: string): Promise<boolean> => {
    try {
      const question = await this.getQuestion(questionID)
      // Question is initialized but not resolved and requestTimestamp is 0 means no proposal yet
      return (
        question.requestTimestamp !== '0' &&
        !question.resolved &&
        !question.paused &&
        !question.reset
      )
    } catch (err) {
      return false
    }
  }

  // Get expected payouts for a question
  getExpectedPayouts = async (questionID: string): Promise<string[]> => {
    try {
      return await this.adapter.methods.getExpectedPayouts(questionID).call()
    } catch (err) {
      // Returns empty array if not ready
      return []
    }
  }

  // Resolve a question
  resolve = async (questionID: string, from: string): Promise<any> => {
    return await this.adapter.methods.resolve(questionID).send({ from })
  }

  // Check if a question needs a proposal (no one has proposed yet)
  needsProposal = async (questionID: string): Promise<boolean> => {
    try {
      const question = await this.getQuestion(questionID)
      // If initialized but requestTimestamp is 0, it means no price request has been made yet
      // This happens after initialize() is called but before anyone proposes
      return question.requestTimestamp === '0' && !question.resolved
    } catch (err) {
      return false
    }
  }

  // Get the Optimistic Oracle contract instance for direct interaction
  // Users need to call proposePrice() on the OO contract to submit answers
  getOptimisticOracleAddress = (): string => {
    return UMA_CONFIG.BASE_SEPOLIA.optimisticOracle
  }

  // Get oracle request from OptimisticOracleV2
  getOracleRequest = async (
    questionID: string,
  ): Promise<{
    proposer: string
    disputer: string
    currency: string
    settled: boolean
    proposedPrice: string
    resolvedPrice: string
    expirationTime: string
    reward: string
    bond: string
  } | null> => {
    try {
      const questionData = await this.getQuestion(questionID)
      if (questionData.requestTimestamp === '0') return null

      const request = await this.optimisticOracle.methods
        .getRequest(
          UMA_CONFIG.BASE_SEPOLIA.umaCtfAdapter,
          UMA_CONFIG.BASE_SEPOLIA.priceIdentifier,
          questionData.requestTimestamp,
          questionData.ancillaryData,
        )
        .call()

      return {
        proposer: request[0],
        disputer: request[1],
        currency: request[2],
        settled: request[3],
        proposedPrice: request[5], // FIXED: Was index 6, should be 5
        resolvedPrice: request[6],
        expirationTime: request[7],
        reward: request[8],
        bond: request[4][5], // requestSettings.bond
      }
    } catch (err) {
      console.error('Error getting oracle request:', err)
      return null
    }
  }

  // Propose price to OptimisticOracleV2 (NOT the adapter!)
  proposePrice = async (
    questionID: string,
    proposedPrice: string, // '0' for NO, '1000000000000000000' for YES
    from: string,
  ): Promise<any> => {
    const questionData = await this.getQuestion(questionID)

    return await this.optimisticOracle.methods
      .proposePrice(
        UMA_CONFIG.BASE_SEPOLIA.umaCtfAdapter, // requester
        UMA_CONFIG.BASE_SEPOLIA.priceIdentifier, // identifier
        questionData.requestTimestamp, // timestamp
        questionData.ancillaryData, // ancillaryData
        proposedPrice, // proposedPrice
      )
      .send({ from })
  }

  // Dispute price on OptimisticOracleV2
  disputePrice = async (questionID: string, from?: string): Promise<any> => {
    const questionData = await this.getQuestion(questionID)

    // Use the connected account if 'from' is not provided
    const accounts = await this.web3.eth.getAccounts()
    const fromAddress = from || accounts[0]

    return await this.optimisticOracle.methods
      .disputePrice(
        UMA_CONFIG.BASE_SEPOLIA.umaCtfAdapter, // requester
        UMA_CONFIG.BASE_SEPOLIA.priceIdentifier, // identifier
        questionData.requestTimestamp, // timestamp
        questionData.ancillaryData, // ancillaryData
      )
      .send({ from: fromAddress })
  }

  // Settle price on OptimisticOracleV2 after liveness expires
  settle = async (questionID: string, from?: string): Promise<any> => {
    const questionData = await this.getQuestion(questionID)

    // Use the connected account if 'from' is not provided
    const accounts = await this.web3.eth.getAccounts()
    const fromAddress = from || accounts[0]

    return await this.optimisticOracle.methods
      .settle(
        UMA_CONFIG.BASE_SEPOLIA.umaCtfAdapter, // requester
        UMA_CONFIG.BASE_SEPOLIA.priceIdentifier, // identifier
        questionData.requestTimestamp, // timestamp
        questionData.ancillaryData, // ancillaryData
      )
      .send({ from: fromAddress })
  }

  // Helper to fetch events in chunks to avoid block range limits
  private async fetchEventsInChunks(
    eventName: string,
    fromBlock: number,
    toBlock: number | 'latest',
    chunkSize: number = 50000,
  ): Promise<any[]> {
    const latestBlock = toBlock === 'latest' ? await this.web3.eth.getBlockNumber() : toBlock
    const allEvents: any[] = []

    let currentFrom = fromBlock
    while (currentFrom <= latestBlock) {
      const currentTo = Math.min(currentFrom + chunkSize - 1, latestBlock)

      try {
        const events = await this.adapter.getPastEvents(eventName, {
          fromBlock: currentFrom,
          toBlock: currentTo,
        })
        allEvents.push(...events)
      } catch (err) {
        console.error(`Error fetching events from ${currentFrom} to ${currentTo}:`, err)
        // Continue with next chunk even if one fails
      }

      currentFrom = currentTo + 1
    }

    return allEvents
  }

  // Get all QuestionInitialized events
  getQuestionInitializedEvents = async (
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest',
  ): Promise<QuestionInitializedEvent[]> => {
    const events = await this.fetchEventsInChunks(
      'QuestionInitialized',
      fromBlock,
      toBlock,
      50000, // Chunk size well below 100k limit
    )

    return events.map((event: any) => ({
      questionID: event.returnValues.questionID,
      requestTimestamp: event.returnValues.requestTimestamp,
      creator: event.returnValues.creator,
      ancillaryData: event.returnValues.ancillaryData,
      rewardToken: event.returnValues.rewardToken,
      reward: event.returnValues.reward,
      proposalBond: event.returnValues.proposalBond,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }))
  }

  // Get all QuestionResolved events
  getQuestionResolvedEvents = async (
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest',
  ): Promise<any[]> => {
    const events = await this.fetchEventsInChunks(
      'QuestionResolved',
      fromBlock,
      toBlock,
      50000, // Chunk size well below 100k limit
    )

    return events.map((event: any) => ({
      questionID: event.returnValues.questionID,
      settledPrice: event.returnValues.settledPrice,
      payouts: event.returnValues.payouts,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }))
  }

  // Get contract address
  getAddress = (): string => {
    return this.adapter.options.address
  }
}
