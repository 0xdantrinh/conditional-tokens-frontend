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
  status: 'Waiting for Proposal' | 'Proposed - Pending Liveness' | 'Ready to Resolve' | 'Resolved'
}

export type StatusFilter = 'All' | 'Pending' | 'Ready' | 'Resolved'
