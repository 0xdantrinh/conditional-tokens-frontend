import { QuestionInitializedEvent, QuestionData } from 'src/logic/UmaOracle'

export interface EnrichedQuestion extends QuestionInitializedEvent {
  questionData: QuestionData | null
  isReady: boolean
  parsedData: {
    title: string
    description: string
    resData: string
    raw: string
  }
  status:
    | 'Waiting for Proposal'
    | 'Proposed - Pending Liveness'
    | 'Disputed'
    | 'Ready to Resolve'
    | 'Resolved'
  oracleRequest: {
    proposer: string
    disputer: string
    currency: string
    settled: boolean
    proposedPrice: string
    resolvedPrice: string
    expirationTime: string
    reward: string
    bond: string
  } | null
}

export type StatusFilter = 'All' | 'Pending' | 'Ready' | 'Resolved'
